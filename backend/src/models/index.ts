// ============================================
// Core Entity Models
// ============================================
export { default as User } from './User';
export { default as Game } from './Game';
export { default as Platform } from './Platform';
export { default as Developer } from './Developer';
export { default as Publisher } from './Publisher';
export { default as Genre } from './Genre';
export { default as Award } from './Award';
export { default as PreservationSource } from './PreservationSource';

// ============================================
// User-Related Models
// ============================================
export { default as UserCollection } from './UserCollection';
export { default as Wishlist } from './Wishlist';
export { default as Review } from './Review';
export { default as ReviewLike } from './ReviewLike';
export { default as Notification } from './Notification';
export { default as UserActivity } from './UserActivity';

// ============================================
// Re-release Models
// ============================================
export { default as RereleaseRequest } from './RereleaseRequest';
export { default as RereleaseVote } from './RereleaseVote';

// ============================================
// Junction / Relationship Models
// ============================================
export { default as GamePlatform } from './GamePlatform';
export { default as GameGenre } from './GameGenre';
export { default as GameAward } from './GameAward';
export { default as GamePreservation } from './GamePreservation';

// ============================================
// Tracking Models
// ============================================
export { default as GameStatusHistory } from './GameStatusHistory';

// ============================================
// Import all models for association setup
// ============================================
import User from './User';
import Game from './Game';
import Platform from './Platform';
import Developer from './Developer';
import Publisher from './Publisher';
import Genre from './Genre';
import Award from './Award';
import PreservationSource from './PreservationSource';
import UserCollection from './UserCollection';
import Wishlist from './Wishlist';
import Review from './Review';
import ReviewLike from './ReviewLike';
import Notification from './Notification';
import UserActivity from './UserActivity';
import RereleaseRequest from './RereleaseRequest';
import RereleaseVote from './RereleaseVote';
import GamePlatform from './GamePlatform';
import GameGenre from './GameGenre';
import GameAward from './GameAward';
import GamePreservation from './GamePreservation';
import GameStatusHistory from './GameStatusHistory';

// ============================================
// Define Associations
// ============================================

export function setupAssociations(): void {
  // --- Developer / Publisher → Game ---
  Developer.hasMany(Game, { foreignKey: 'developer_id', as: 'games' });
  Game.belongsTo(Developer, { foreignKey: 'developer_id', as: 'developer' });

  Publisher.hasMany(Game, { foreignKey: 'publisher_id', as: 'games' });
  Game.belongsTo(Publisher, { foreignKey: 'publisher_id', as: 'publisher' });

  // Self-referencing: acquired_by
  Developer.belongsTo(Developer, { foreignKey: 'acquired_by', as: 'acquirer' });
  Developer.hasMany(Developer, { foreignKey: 'acquired_by', as: 'acquisitions' });

  Publisher.belongsTo(Publisher, { foreignKey: 'acquired_by', as: 'acquirer' });
  Publisher.hasMany(Publisher, { foreignKey: 'acquired_by', as: 'acquisitions' });

  // --- Game ↔ Platform (N:N via GamePlatform) ---
  Game.belongsToMany(Platform, { through: GamePlatform, foreignKey: 'game_id', otherKey: 'platform_id', as: 'platforms' });
  Platform.belongsToMany(Game, { through: GamePlatform, foreignKey: 'platform_id', otherKey: 'game_id', as: 'games' });

  // Direct associations on junction table for eager loading from GamePlatform
  GamePlatform.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });
  GamePlatform.belongsTo(Platform, { foreignKey: 'platform_id', as: 'platform' });
  Game.hasMany(GamePlatform, { foreignKey: 'game_id', as: 'gamePlatforms' });
  Platform.hasMany(GamePlatform, { foreignKey: 'platform_id', as: 'gamePlatforms' });

  // --- Game ↔ Genre (N:N via GameGenre) ---
  Game.belongsToMany(Genre, { through: GameGenre, foreignKey: 'game_id', otherKey: 'genre_id', as: 'genres' });
  Genre.belongsToMany(Game, { through: GameGenre, foreignKey: 'genre_id', otherKey: 'game_id', as: 'games' });

  // --- Game ↔ Award (N:N via GameAward) ---
  Game.belongsToMany(Award, { through: GameAward, foreignKey: 'game_id', otherKey: 'award_id', as: 'awards' });
  Award.belongsToMany(Game, { through: GameAward, foreignKey: 'award_id', otherKey: 'game_id', as: 'games' });

  // --- Game ↔ PreservationSource (N:N via GamePreservation) ---
  Game.belongsToMany(PreservationSource, { through: GamePreservation, foreignKey: 'game_id', otherKey: 'source_id', as: 'preservationSources' });
  PreservationSource.belongsToMany(Game, { through: GamePreservation, foreignKey: 'source_id', otherKey: 'game_id', as: 'games' });

  // Direct associations on GamePreservation junction for eager loading
  GamePreservation.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });
  GamePreservation.belongsTo(PreservationSource, { foreignKey: 'source_id', as: 'source' });
  Game.hasMany(GamePreservation, { foreignKey: 'game_id', as: 'gamePreservations' });
  PreservationSource.hasMany(GamePreservation, { foreignKey: 'source_id', as: 'gamePreservations' });

  // --- User → UserCollection ---
  User.hasMany(UserCollection, { foreignKey: 'user_id', as: 'collections' });
  UserCollection.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Game.hasMany(UserCollection, { foreignKey: 'game_id', as: 'collectionEntries' });
  UserCollection.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });
  Platform.hasMany(UserCollection, { foreignKey: 'platform_id', as: 'collectionEntries' });
  UserCollection.belongsTo(Platform, { foreignKey: 'platform_id', as: 'platform' });

  // --- User → Wishlist ---
  User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlists' });
  Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Game.hasMany(Wishlist, { foreignKey: 'game_id', as: 'wishlistEntries' });
  Wishlist.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });
  Platform.hasMany(Wishlist, { foreignKey: 'platform_id', as: 'wishlistEntries' });
  Wishlist.belongsTo(Platform, { foreignKey: 'platform_id', as: 'platform' });

  // --- User → Review ---
  User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
  Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Game.hasMany(Review, { foreignKey: 'game_id', as: 'reviews' });
  Review.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });
  Platform.hasMany(Review, { foreignKey: 'platform_id', as: 'reviews' });
  Review.belongsTo(Platform, { foreignKey: 'platform_id', as: 'platform' });

  // --- Review → ReviewLike ---
  Review.hasMany(ReviewLike, { foreignKey: 'review_id', as: 'likes' });
  ReviewLike.belongsTo(Review, { foreignKey: 'review_id', as: 'review' });
  User.hasMany(ReviewLike, { foreignKey: 'user_id', as: 'reviewLikes' });
  ReviewLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // --- User → Notification ---
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Game.hasMany(Notification, { foreignKey: 'game_id', as: 'notifications' });
  Notification.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });

  // --- User → UserActivity ---
  User.hasMany(UserActivity, { foreignKey: 'user_id', as: 'activities' });
  UserActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // --- Game → RereleaseRequest ---
  Game.hasOne(RereleaseRequest, { foreignKey: 'game_id', as: 'rereleaseRequest' });
  RereleaseRequest.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });

  // --- RereleaseRequest → RereleaseVote ---
  RereleaseRequest.hasMany(RereleaseVote, { foreignKey: 'request_id', as: 'votes' });
  RereleaseVote.belongsTo(RereleaseRequest, { foreignKey: 'request_id', as: 'request' });
  User.hasMany(RereleaseVote, { foreignKey: 'user_id', as: 'rereleaseVotes' });
  RereleaseVote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // --- Game → GameStatusHistory ---
  Game.hasMany(GameStatusHistory, { foreignKey: 'game_id', as: 'statusHistory' });
  GameStatusHistory.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });
  GameStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedByUser' });
  User.hasMany(GameStatusHistory, { foreignKey: 'changed_by', as: 'statusChanges' });
}

// Initialize associations immediately
setupAssociations();
