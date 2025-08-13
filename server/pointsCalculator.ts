import { Campaign, Product, PointTier, ProcessSale } from "@shared/schema";

interface PointCalculationResult {
  totalPoints: number;
  itemPoints: Array<{
    productId?: string;
    productName: string;
    points: number;
    calculation: string;
  }>;
  appliedRules: string[];
}

export class PointsCalculator {
  /**
   * Calculate points for a sale based on campaign and product rules
   */
  static async calculatePoints(
    saleData: ProcessSale,
    campaign?: Campaign | null,
    products?: Product[],
    pointTiers?: PointTier[]
  ): Promise<PointCalculationResult> {
    let totalPoints = 0;
    const itemPoints: PointCalculationResult['itemPoints'] = [];
    const appliedRules: string[] = [];

    // Process each item in the sale
    for (const item of saleData.items) {
      const product = products?.find(p => p.id === item.productId);
      let itemPointsCalculated = 0;
      let calculationMethod = "";

      // Determine point calculation method for this item
      if (product && product.pointCalculationType !== "inherit") {
        // Use product-specific calculation
        const result = this.calculateProductPoints(item, product, pointTiers);
        itemPointsCalculated = result.points;
        calculationMethod = result.calculation;
        appliedRules.push(`Product "${product.name}": ${result.calculation}`);
      } else if (campaign) {
        // Use campaign-level calculation
        const result = this.calculateCampaignPoints(item, campaign, pointTiers);
        itemPointsCalculated = result.points;
        calculationMethod = result.calculation;
        appliedRules.push(`Campaign "${campaign.name}": ${result.calculation}`);
      } else {
        // Default fallback: 1 point per $10 spent
        itemPointsCalculated = Math.floor(item.totalPrice / 10);
        calculationMethod = "Default: 1 point per $10";
        appliedRules.push("Default rule: 1 point per $10");
      }

      // Apply quantity multiplier
      itemPointsCalculated *= item.quantity;

      // Apply product bonus multiplier if exists
      if (product?.bonusMultiplier && parseFloat(product.bonusMultiplier) !== 1.0) {
        itemPointsCalculated = Math.floor(itemPointsCalculated * parseFloat(product.bonusMultiplier));
        calculationMethod += ` × ${product.bonusMultiplier} (bonus)`;
      }

      totalPoints += itemPointsCalculated;
      itemPoints.push({
        productId: item.productId,
        productName: item.productName,
        points: itemPointsCalculated,
        calculation: calculationMethod
      });
    }

    // Apply campaign maximum points limit
    if (campaign?.maximumPoints && totalPoints > campaign.maximumPoints) {
      appliedRules.push(`Capped at ${campaign.maximumPoints} points (campaign maximum)`);
      totalPoints = campaign.maximumPoints;
    }

    // Apply campaign minimum purchase requirement
    if (campaign?.minimumPurchase && saleData.totalAmount < parseFloat(campaign.minimumPurchase)) {
      appliedRules.push(`Minimum purchase of $${campaign.minimumPurchase} not met - no points awarded`);
      totalPoints = 0;
      itemPoints.forEach(item => item.points = 0);
    }

    return {
      totalPoints,
      itemPoints,
      appliedRules
    };
  }

  /**
   * Calculate points using product-specific rules
   */
  private static calculateProductPoints(
    item: ProcessSale['items'][0],
    product: Product,
    pointTiers?: PointTier[]
  ): { points: number; calculation: string } {
    switch (product.pointCalculationType) {
      case "fixed":
        return {
          points: product.fixedPoints || 0,
          calculation: `${product.fixedPoints || 0} fixed points`
        };

      case "percentage":
        const percentageRate = parseFloat(product.percentageRate || "0");
        const points = Math.floor((item.totalPrice * percentageRate) / 100);
        return {
          points,
          calculation: `${percentageRate}% of $${item.totalPrice} = ${points} points`
        };

      case "tier":
        const tier = this.findApplicableTier(item.totalPrice, pointTiers, product.id);
        if (tier) {
          let tierPoints = tier.points;
          if (tier.multiplier && parseFloat(tier.multiplier) !== 1.0) {
            tierPoints = Math.floor(tierPoints * parseFloat(tier.multiplier));
            return {
              points: tierPoints,
              calculation: `Tier: ${tier.points} points × ${tier.multiplier} = ${tierPoints} points`
            };
          }
          return {
            points: tierPoints,
            calculation: `Tier: ${tierPoints} points`
          };
        }
        // Fallback if no tier matches
        return { points: 0, calculation: "No matching tier found" };

      default:
        return { points: 0, calculation: "Unknown calculation type" };
    }
  }

  /**
   * Calculate points using campaign-level rules
   */
  private static calculateCampaignPoints(
    item: ProcessSale['items'][0],
    campaign: Campaign,
    pointTiers?: PointTier[]
  ): { points: number; calculation: string } {
    switch (campaign.pointCalculationType) {
      case "fixed":
        return {
          points: campaign.rewardPerReferral,
          calculation: `${campaign.rewardPerReferral} fixed points per referral`
        };

      case "percentage":
        const percentageRate = parseFloat(campaign.percentageRate || "0");
        const points = Math.floor((item.totalPrice * percentageRate) / 100);
        return {
          points,
          calculation: `${percentageRate}% of $${item.totalPrice} = ${points} points`
        };

      case "tier":
        const tier = this.findApplicableTier(item.totalPrice, pointTiers, undefined, campaign.id);
        if (tier) {
          let tierPoints = tier.points;
          if (tier.multiplier && parseFloat(tier.multiplier) !== 1.0) {
            tierPoints = Math.floor(tierPoints * parseFloat(tier.multiplier));
            return {
              points: tierPoints,
              calculation: `Campaign tier: ${tier.points} points × ${tier.multiplier} = ${tierPoints} points`
            };
          }
          return {
            points: tierPoints,
            calculation: `Campaign tier: ${tierPoints} points`
          };
        }
        // Fallback if no tier matches
        return { points: 0, calculation: "No matching campaign tier found" };

      default:
        // Fallback to fixed points
        return {
          points: campaign.rewardPerReferral,
          calculation: `${campaign.rewardPerReferral} default points`
        };
    }
  }

  /**
   * Find the applicable point tier for a given amount
   */
  private static findApplicableTier(
    amount: number,
    pointTiers?: PointTier[],
    productId?: string,
    campaignId?: string
  ): PointTier | undefined {
    if (!pointTiers) return undefined;

    // Filter tiers based on product or campaign
    const relevantTiers = pointTiers.filter(tier => {
      if (productId && tier.productId === productId) return true;
      if (campaignId && tier.campaignId === campaignId) return true;
      return false;
    });

    // Find the tier that matches the amount
    return relevantTiers.find(tier => {
      const minAmount = parseFloat(tier.minAmount);
      const maxAmount = tier.maxAmount ? parseFloat(tier.maxAmount) : Infinity;
      return amount >= minAmount && amount <= maxAmount;
    });
  }

  /**
   * Preview points calculation without processing the sale
   */
  static async previewPoints(
    saleData: ProcessSale,
    campaign?: Campaign | null,
    products?: Product[],
    pointTiers?: PointTier[]
  ): Promise<PointCalculationResult> {
    return this.calculatePoints(saleData, campaign, products, pointTiers);
  }
}