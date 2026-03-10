const swaggerJsdoc  = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "NEXORA API",
            version: "1.0.0",
            description: "API documentation for NEXORA",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
            {
                url: "https://nexora-api-rho.vercel.app",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./src/routes/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;