const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Document Management System API',
      version: '1.0.0',
      description: 'A comprehensive document management system with role-based access control',
      contact: {
        name: 'API Support',
        email: 'support@docmanagement.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-url.com/api' 
          : `http://localhost:${process.env.PORT || 5000}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            userLevel: {
              type: 'string',
              enum: ['admin', 'level1', 'level2', 'level3'],
              description: 'User access level'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Document ID'
            },
            title: {
              type: 'string',
              description: 'Document title (mandatory)'
            },
            filePath: {
              type: 'string',
              description: 'File path on server'
            },
            location: {
              type: 'string',
              description: 'Document location/category (mandatory)'
            },
            status: {
              type: 'string',
              enum: ['active', 'archived', 'deleted'],
              description: 'Document status'
            },
            certificateType: {
              type: 'string',
              enum: ['SHM', 'SHGB', 'SHGU', 'SHP', 'HPL', 'AJB', 'Girik', 'Others'],
              description: 'Certificate type (mandatory)'
            },
            landSize: {
              type: 'string',
              description: 'Land size measurement (optional, e.g., "500 m²")'
            },
            areaName: {
              type: 'string',
              description: 'Area name or zone designation (optional)'
            },
            projectName: {
              type: 'string',
              description: 'Associated project name (optional)'
            },
            zoneUrl: {
              type: 'string',
              format: 'uri',
              description: 'Maps/location URL for the property (optional)'
            },
            zoneRtdr: {
              type: 'string',
              description: 'RT/RW designation or zone code (optional)'
            },
            publishDate: {
              type: 'string',
              format: 'date',
              description: 'Certificate publication date in YYYY-MM-DD format (mandatory)'
            },
            expiredDate: {
              type: 'string',
              format: 'date',
              description: 'Certificate expiration date in YYYY-MM-DD format (optional)'
            },
            documentObtained: {
              type: 'string',
              format: 'date',
              description: 'Date document was obtained in YYYY-MM-DD format (optional)'
            },
            originDocument: {
              type: 'string',
              description: 'Original document reference or serial number (optional)'
            },
            previousOwner: {
              type: 'string',
              description: 'Previous property owner name or entity (optional)'
            },
            company: {
              type: 'string',
              enum: ['JH', 'JHT', 'BEP', 'PIJ'],
              description: 'Associated company code (mandatory)'
            },
            createdBy: {
              type: 'integer',
              description: 'ID of user who created the document'
            },
            metadata: {
              type: 'object',
              description: 'Additional document metadata'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            creator: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Creator username'
                }
              }
            },
            subDocuments: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SubDocument'
              }
            }
          }
        },
        SubDocument: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Sub-document ID'
            },
            title: {
              type: 'string',
              description: 'Sub-document title'
            },
            filePath: {
              type: 'string',
              description: 'File path on server'
            },
            parentDocumentId: {
              type: 'integer',
              description: 'Parent document ID'
            },
            location: {
              type: 'string',
              description: 'Sub-document location/category'
            },
            certificateType: {
              type: 'string',
              enum: ['SHM', 'SHGB', 'SHGU', 'SHP', 'HPL', 'AJB', 'Girik', 'Others'],
              description: 'Certificate type for sub-document'
            },
            landSize: {
              type: 'string',
              description: 'Land size measurement for sub-document'
            },
            areaName: {
              type: 'string',
              description: 'Area name or zone designation for sub-document'
            },
            projectName: {
              type: 'string',
              description: 'Associated project name for sub-document'
            },
            zoneUrl: {
              type: 'string',
              format: 'uri',
              description: 'Maps/location URL for the sub-document property'
            },
            zoneRtdr: {
              type: 'string',
              description: 'RT/RW designation or zone code for sub-document'
            },
            publishDate: {
              type: 'string',
              format: 'date',
              description: 'Certificate publication date in YYYY-MM-DD format'
            },
            expiredDate: {
              type: 'string',
              format: 'date',
              description: 'Certificate expiration date in YYYY-MM-DD format'
            },
            documentObtained: {
              type: 'string',
              format: 'date',
              description: 'Date document was obtained in YYYY-MM-DD format'
            },
            originDocument: {
              type: 'string',
              description: 'Original document reference or serial number'
            },
            previousOwner: {
              type: 'string',
              description: 'Previous property owner name or entity'
            },
            company: {
              type: 'string',
              enum: ['JH', 'JHT', 'BEP', 'PIJ'],
              description: 'Associated company code'
            },
            status: {
              type: 'string',
              enum: ['active', 'archived', 'deleted'],
              description: 'Sub-document status'
            },
            metadata: {
              type: 'object',
              description: 'Additional sub-document metadata'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              description: 'User email'
            },
            userLevel: {
              type: 'string',
              description: 'User access level'
            },
            token: {
              type: 'string',
              description: 'JWT token'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = specs;