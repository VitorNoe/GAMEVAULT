import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GameVault API',
      version: '1.0.0',
      description:
        'REST API for GameVault – a game management, collection tracking, and preservation platform. ' +
        'Supports user authentication (JWT), game catalog management, personal collections, wishlists, ' +
        'reviews, media uploads, release tracking, preservation sources, re-release voting, and admin moderation.',
      contact: {
        name: 'Vitor Luciano Cardoso Noé',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & account management' },
      { name: 'Users', description: 'User profiles & administration' },
      { name: 'Games', description: 'Game catalog CRUD & search' },
      { name: 'Platforms', description: 'Platform catalog CRUD' },
      { name: 'Collection', description: 'Personal game collection management' },
      { name: 'Wishlist', description: 'Wishlist management' },
      { name: 'Reviews', description: 'Game reviews & ratings' },
      { name: 'Media', description: 'File uploads & media management' },
      { name: 'Preservation', description: 'Game preservation sources & links' },
      { name: 'Re-releases', description: 'Re-release requests & voting' },
      { name: 'Notifications', description: 'Notifications & preferences' },
      { name: 'RAWG', description: 'External RAWG API integration (admin)' },
      { name: 'Admin', description: 'Administration panel endpoints' },
      { name: 'Health', description: 'Health check' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter the JWT token obtained from POST /auth/login. ' +
            'Format: Bearer <token>',
        },
      },
      schemas: {
        // ─── Common ──────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
          example: {
            success: false,
            message: 'Unauthorized – invalid or expired token',
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please provide a valid email' },
                },
              },
            },
          },
          example: {
            success: false,
            errors: [
              { field: 'email', message: 'Please provide a valid email' },
              { field: 'password', message: 'Password must be at least 6 characters long' },
            ],
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 150 },
            totalPages: { type: 'integer', example: 8 },
          },
        },

        // ─── Auth ────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'securePass123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'securePass123' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string', example: 'abc123resettoken' },
            password: { type: 'string', minLength: 6, example: 'newSecurePass456' },
          },
        },

        // ─── User ────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            bio: { type: 'string', example: 'Retro gaming enthusiast', nullable: true },
            avatar_url: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg', nullable: true },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            is_verified: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Updated' },
            bio: { type: 'string', maxLength: 500, example: 'Updated bio text' },
            avatar_url: { type: 'string', format: 'uri', example: 'https://example.com/new-avatar.jpg' },
          },
        },

        // ─── Game ────────────────────────────────────────────────
        Game: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'The Legend of Zelda: Breath of the Wild' },
            slug: { type: 'string', example: 'the-legend-of-zelda-breath-of-the-wild' },
            description: { type: 'string', nullable: true },
            release_date: { type: 'string', format: 'date', nullable: true, example: '2017-03-03' },
            release_status: {
              type: 'string',
              enum: ['released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'],
              example: 'released',
            },
            availability_status: {
              type: 'string',
              enum: ['available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'],
              example: 'available',
            },
            cover_url: { type: 'string', format: 'uri', nullable: true },
            metacritic_score: { type: 'integer', nullable: true, example: 97 },
            developer: { type: 'string', nullable: true, example: 'Nintendo EPD' },
            publisher: { type: 'string', nullable: true, example: 'Nintendo' },
            genres: { type: 'string', nullable: true, example: 'Action, Adventure' },
            tags: { type: 'string', nullable: true },
            is_goty: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateGameRequest: {
          type: 'object',
          required: ['title', 'slug'],
          properties: {
            title: { type: 'string', maxLength: 255, example: 'New Game Title' },
            slug: { type: 'string', maxLength: 255, example: 'new-game-title' },
            description: { type: 'string' },
            release_date: { type: 'string', format: 'date', example: '2025-12-15' },
            release_status: {
              type: 'string',
              enum: ['released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'],
            },
            availability_status: {
              type: 'string',
              enum: ['available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'],
            },
            cover_url: { type: 'string', format: 'uri' },
            metacritic_score: { type: 'integer' },
            developer: { type: 'string' },
            publisher: { type: 'string' },
            genres: { type: 'string' },
            tags: { type: 'string' },
            is_goty: { type: 'boolean' },
          },
        },

        // ─── Platform ────────────────────────────────────────────
        Platform: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'PlayStation 5' },
            slug: { type: 'string', example: 'playstation-5' },
            type: { type: 'string', enum: ['console', 'handheld', 'pc', 'mobile'], example: 'console' },
            manufacturer: { type: 'string', nullable: true, example: 'Sony' },
            release_year: { type: 'integer', nullable: true, example: 2020 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreatePlatformRequest: {
          type: 'object',
          required: ['name', 'slug', 'type'],
          properties: {
            name: { type: 'string', maxLength: 100, example: 'Xbox Series X' },
            slug: { type: 'string', maxLength: 100, example: 'xbox-series-x' },
            type: { type: 'string', enum: ['console', 'handheld', 'pc', 'mobile'], example: 'console' },
            manufacturer: { type: 'string', example: 'Microsoft' },
            release_year: { type: 'integer', example: 2020 },
          },
        },

        // ─── Collection ──────────────────────────────────────────
        CollectionItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            game_id: { type: 'integer', example: 42 },
            platform_id: { type: 'integer', example: 3 },
            status: {
              type: 'string',
              enum: ['playing', 'completed', 'paused', 'abandoned', 'not_started', 'wishlist', 'backlog'],
              example: 'playing',
            },
            format: { type: 'string', enum: ['physical', 'digital'], example: 'digital' },
            rating: { type: 'integer', minimum: 1, maximum: 10, nullable: true, example: 8 },
            price_paid: { type: 'number', nullable: true, example: 59.99 },
            hours_played: { type: 'number', nullable: true, example: 45.5 },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        AddToCollectionRequest: {
          type: 'object',
          required: ['game_id', 'platform_id'],
          properties: {
            game_id: { type: 'integer', example: 42 },
            platform_id: { type: 'integer', example: 3 },
            status: {
              type: 'string',
              enum: ['playing', 'completed', 'paused', 'abandoned', 'not_started', 'wishlist', 'backlog'],
              example: 'not_started',
            },
            format: { type: 'string', enum: ['physical', 'digital'], example: 'digital' },
            rating: { type: 'integer', minimum: 1, maximum: 10 },
            price_paid: { type: 'number', minimum: 0, example: 59.99 },
          },
        },

        // ─── Wishlist ────────────────────────────────────────────
        WishlistItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            game_id: { type: 'integer', example: 42 },
            priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'high' },
            max_price: { type: 'number', nullable: true, example: 29.99 },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AddToWishlistRequest: {
          type: 'object',
          required: ['game_id'],
          properties: {
            game_id: { type: 'integer', example: 42 },
            priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'medium' },
            max_price: { type: 'number', minimum: 0, example: 29.99 },
          },
        },

        // ─── Review ──────────────────────────────────────────────
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            game_id: { type: 'integer', example: 42 },
            rating: { type: 'integer', minimum: 1, maximum: 10, example: 9 },
            title: { type: 'string', example: 'A masterpiece' },
            body: { type: 'string', example: 'Incredible open-world experience...' },
            likes_count: { type: 'integer', example: 15 },
            dislikes_count: { type: 'integer', example: 2 },
            is_flagged: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Preservation ────────────────────────────────────────
        PreservationSource: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Internet Archive' },
            type: { type: 'string', example: 'archive' },
            url: { type: 'string', format: 'uri', example: 'https://archive.org' },
            description: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Re-release ──────────────────────────────────────────
        RereleaseRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            game_id: { type: 'integer', example: 42 },
            status: { type: 'string', enum: ['active', 'fulfilled', 'archived'], example: 'active' },
            vote_count: { type: 'integer', example: 128 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Notification ────────────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            type: { type: 'string', example: 'wishlist_release' },
            title: { type: 'string', example: 'Game Released!' },
            body: { type: 'string', example: 'A game on your wishlist has been released.' },
            is_read: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Media ───────────────────────────────────────────────
        Media: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            entity_type: { type: 'string', example: 'game' },
            entity_id: { type: 'integer', example: 42 },
            type: { type: 'string', enum: ['image', 'video', 'document'], example: 'image' },
            filename: { type: 'string', example: 'cover.jpg' },
            url: { type: 'string', format: 'uri' },
            size: { type: 'integer', example: 204800 },
            mime_type: { type: 'string', example: 'image/jpeg' },
            is_public: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required – missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Unauthorized – invalid or expired token' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions (admin required)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Forbidden – admin access required' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found' },
            },
          },
        },
        ValidationFailed: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Too many requests, please try again later' },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
