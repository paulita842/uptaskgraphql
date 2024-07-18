const Usuario = require("../models/Usuario");
const Proyecto = require("../models/Proyecto");
const Tarea = require("../models/Tareas");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

//Crea y firma un JWT
const CrearToken = (usuario, secreta, expiresIn) => {
  const { id, email } = usuario;

  return jwt.sign({ id, email }, secreta, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerProyectos: async (_, {}, ctx) => {
      const proyectos = await Proyecto.find({ creador: ctx.usuario.id });

      return proyectos;
    },

    obtenerTareas: async (_, { input }, ctx) => {
      const tareas = await Tarea.find({ creador: ctx.usuario.id })
        .where("proyecto")
        .equals(input.proyecto);

      return tareas;
    },
  },

  Mutation: {
    crearUsuario: async (_, { input }) => {
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });

      //si el usuario existe
      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }

      try {
        //Hashear password
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(password, salt);

        //registrar un nuevo usuario
        const nuevoUsuario = new Usuario(input);

        nuevoUsuario.save();
        return "Usuario Creado Correctamente";
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      //Si el usuario existe

      const existeUsuario = await Usuario.findOne({ email });

      //si el usuario no existe
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      //si el password es correcto
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );

      if (!passwordCorrecto) {
        throw new Error("Password Incorrecto");
      }

      //Dar acceso a la app
      return {
        token: CrearToken(existeUsuario, process.env.SECRETA, "8hr"),
      };
    },
    nuevoProyecto: async (_, { input }, ctx) => {
      try {
        const proyecto = new Proyecto(input);

        console.log("obteniendo proyecto", proyecto);

        //asociar al creador
        proyecto.creador = ctx.usuario.id;

        //almacenar en la BD
        const resultado = await proyecto.save();

        console.log("proyecto buscado", resultado);

        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProyecto: async (_, { id, input }, ctx) => {
      //Revisar que el proyecto exista
      let proyecto = await Proyecto.findById(id);

      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }
      //Revisar si la persona que esta editando es el creador
      if (proyecto.creador.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      //guardar el proyecto

      proyecto = await Proyecto.findByIdAndUpdate({ _id: id }, input, {
        new: true,
      });

      return proyecto;
    },
    eliminarProyecto: async (_, { id }, ctx) => {
      //Revisar que el proyecto exista
      let proyecto = await Proyecto.findById(id);

      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }
      //Revisar si la persona que esta editando es el creador
      if (proyecto.creador.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      //Eliminar
      await Proyecto.findOneAndDelete({ _id: id });

      return "Proyecto Eliminado";
    },
    nuevaTarea: async (_, { input }, ctx) => {
      try {
        const tarea = new Tarea(input);
        tarea.creador = ctx.usuario.id;
        const resultado = await tarea.save();

        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarTarea: async (_, { id, input, estado }, ctx) => {
      //Revisar que el tarea existe
      let tarea = await Tarea.findById(id);

      if (!tarea) {
        throw new Error("Tarea no encontrado");
      }
      //Revisar si la persona que esta editando es el creador
      if (tarea.creador.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      //Asignar estado

      input.estado = estado;

      //Guardar y retornar la tarea
      tarea = await Tarea.findOneAndUpdate({ _id: id }, input, { new: true });

      return tarea;
    },

    eliminarTarea: async (_, { id }, ctx) => {
      //Revisar que la tarea exista
      let tarea = await Tarea.findById(id);

      if (!tarea) {
        throw new Error("Tarea no encontrada");
      }

      //Revisar si la persona que esta eliminando es el creador
      if (tarea.creador.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales para editar");
      }

      //Eliminar
      await Tarea.findOneAndDelete({ _id: id });

      return "Tarea Eliminada";
    },
  },
};

module.exports = resolvers;
