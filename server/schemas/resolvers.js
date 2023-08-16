const { User } = require("../models");
const { GraphQLError } = require("graphql");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findOne({ _id: context.user._id });
      }
      throw new GraphQLError("You are not signed in");
    },
  },

  Mutation: {
    login: async (parent, args, context) => {
      const user = await User.findOne({
        $or: [{ username: args.username }, { email: args.email }],
      });
      if (!user) {
        throw new GraphQLError("No user with this username/email");
      }

      const correctPw = await user.isCorrectPassword(args.password);

      if (!correctPw) {
        throw new GraphQLError("incorrect password");
      }
      const token = signToken(user);
      return { token, user };
    },

    addUser: async (parent, args, context) => {
      const user = await User.create(args);

      if (!user) {
        throw new GraphQLError("error");
      }
      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, args, context) => {
      console.log(context.user._id);
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (err) {
        console.log(err);
        throw new GraphQLError("Error saving book");
      }
    },

    removeBook: async (parent, args, context) => {
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId: args.bookId } } },
        { new: true }
      );
      if (!updatedUser) {
        throw new GraphQLError("error");
      }
      return updatedUser;
    },
  },
};

module.exports = resolvers;
