const { ApolloServer } = require("apollo-server");

const typeDefs = require("./db/schema");

const resolvers = require("./db/resolvers");

const conectarDB = require("./config/db");

const jwt = require("jsonwebtoken");

require("dotenv").config({ path: "variables.env" });

//Conectar a la BD
conectarDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers["authorization"] || " ";
    if (token) {
      try {
        const usuario = jwt.verify(token.split(" ")[1], process.env.SECRETA);

        return {
          usuario,
        };
      } catch (error) {
        console.log("este es el error que se esta presentando", error);
      }
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Servidor listo en la URL ${url}`);
});
