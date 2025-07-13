
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import {Express} from 'express'

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "GigPoint Api Docs",
            version: "1.0.0",
            description: "This Is API Documentation of gigpoint",
        },
        servers:[ {
            url: "http://127.0.0.1:3000",
        },
        ],
    },
    components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    }
  }
},
security: [
  {
    bearerAuth: []
  }
],
    apis:['src/routes/*.ts']
};

const swaggerSpec = swaggerJSDoc(options)

export const swaggerDocs =(app:Express, port:number):void=> {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    console.log("swagger Docs Is Running")
}