export * from './authController';
export * from './userController';
export * from './gameController';
export * from './platformController';
export * from './collectionController';
export * from './releaseStatusController';
export * from './rawgController';
export * from './reviewController';
export * from './wishlistController';
export * from './preservationController';
export * from './rereleaseController';
export * from './notificationController';
export * from './mediaController';
export {
  adminListUsers,
  adminGetUser,
  adminChangeRole,
  adminBanUser,
  adminUnbanUser,
  adminRemoveUser,
  adminListReviews,
  adminModerateReview,
  adminDeleteReview as adminDeleteReviewV2,
  adminDeleteGame,
  adminGetActivityLogs,
  adminGetModerationLog,
  adminDashboard,
  adminTopGames,
  adminMostReviewed,
  adminActiveUsers,
  adminRereleasesSummary,
  adminRegistrationTrend,
  adminReviewTrend,
} from './adminController';
