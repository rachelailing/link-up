// js/services/marketplace.service.js

const MOCK_DATA = [
  { id: 1, title: "Pro Video Editing Service", price: 50, location: "Online / UTP", date: "3 Mar 2026", rating: 5.0, reviews: 20, type: "Service", status: "Ongoing", description: "Professional video editing for your assignments, vlogs, or club events. Quick turnaround and high-quality results.", tags: ["creative", "video", "media"] },
  { id: 2, title: "Organic Nasi Lemak", price: 5, location: "V4, Block B", date: "4 Mar 2026", rating: 4.9, reviews: 45, type: "Product", status: "Preorder", description: "Delicious home-cooked Nasi Lemak with organic ingredients. Served hot with spicy sambal and crispy anchovies.", tags: ["food", "homemade"] },
  { id: 3, title: "Python Tutoring (Basic)", price: 20, location: "Main Library", date: "2 Mar 2026", rating: 4.9, reviews: 32, type: "Service", status: "Ongoing", description: "Struggling with Python? I can help you understand the basics of programming, loops, and data structures.", tags: ["academic", "tech", "coding", "python"] },
  { id: 4, title: "Laundry Service (Wash & Fold)", price: 8, location: "V5, Ground Floor", date: "1 Mar 2026", rating: 4.6, reviews: 54, type: "Service", status: "Ongoing", description: "Fast and clean laundry service. Wash and fold included. RM 8 per 5kg load.", tags: ["laundry", "service"] },
  { id: 101, title: "Used Calculus Textbook", price: 30, location: "V2, Block A", date: "2 Mar 2026", rating: 4.8, reviews: 12, type: "Product", status: "Ongoing", description: "Thomas' Calculus (14th Edition). Condition: 9/10. No highlights, very clean.", tags: ["textbooks", "academic", "study"] },
  { id: 102, title: "Custom Crochet Keychain", price: 12, location: "All Villages", date: "1 Mar 2026", rating: 4.7, reviews: 8, type: "Product", status: "Preorder", description: "Handmade crochet keychains. Customizable colors and designs. Perfect for gifts!", tags: ["creative", "others", "art"] },
  { id: 103, title: "Second-hand Scientific Calculator", price: 45, location: "V3, Block B", date: "25 Feb 2026", rating: 4.4, reviews: 5, type: "Product", status: "Ongoing", description: "Casio scientific calculator. Good for engineering students.", tags: ["academic", "tech", "gadgets"] },
  { id: 104, title: "Portable Desk Lamp", price: 15, location: "V5, Block C", date: "28 Feb 2026", rating: 4.5, reviews: 15, type: "Product", status: "Ongoing", description: "LED desk lamp with adjustable brightness.", tags: ["others", "study", "lifestyle"] },
  { id: 105, title: "Graphic Design - Poster", price: 15, location: "Remote", date: "28 Feb 2026", rating: 4.8, reviews: 18, type: "Service", status: "Ongoing", description: "Professional poster design for events.", tags: ["creative", "design", "graphic"] }
];

class MarketplaceService {
  async getAllItems() {
    return MOCK_DATA;
  }

  /**
   * Smart recommendation algorithm for marketplace items.
   * @param {Object} profile - Student profile metadata
   * @returns {Promise<Array>}
   */
  async getRecommended(profile = {}) {
    const items = await this.getAllItems();
    
    // Algorithm: Score each item based on interests and campus
    const scoredItems = items.map(item => {
      let score = 0;
      
      const studentInterests = (profile.interests || []).map(i => i.toLowerCase());
      const itemTags = (item.tags || []).map(t => t.toLowerCase());
      const itemTitle = item.title.toLowerCase();

      // 1. Interest Match (High weight)
      studentInterests.forEach(interest => {
        if (itemTags.includes(interest)) score += 10;
        if (itemTitle.includes(interest)) score += 5;
      });

      // 2. Location Match
      if (profile.campus && item.location.includes(profile.campus)) {
        score += 5;
      }

      // 3. Quality Bonus (Rating)
      if (item.rating >= 4.5) {
        score += 2;
      }

      return { ...item, matchScore: score };
    });

    // Sort by score and rating
    const recommendations = scoredItems
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return b.rating - a.rating;
      });

    console.log("[MarketplaceService] Recommendations:", recommendations.map(i => ({ title: i.title, score: i.matchScore })));
    
    return recommendations.slice(0, 4);
  }

  async getProducts() {
    return MOCK_DATA.filter(i => i.type === "Product");
  }

  async getServices() {
    return MOCK_DATA.filter(i => i.type === "Service");
  }

  async getItemById(id) {
    const numericId = parseInt(id);
    const item = MOCK_DATA.find(i => i.id === numericId);
    
    if (item) return item;

    // Check local storage for user's own listings
    const myListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
    return myListings.find(i => i.id === numericId);
  }

  async getMyListings() {
    const myListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
    // Merge with some mock data for demo if empty
    if (myListings.length === 0) {
      return MOCK_DATA.filter(i => [101, 102].includes(i.id));
    }
    return myListings;
  }
}

export const marketplaceService = new MarketplaceService();
