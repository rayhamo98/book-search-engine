import { UserInputError } from 'apollo-server-express';
import User from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js'; // Import JwtPayload


interface BookInput {
  bookId: string;
  authors?: string[];
  description?: string;
  title: string;
  image?: string;
  link?: string;
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: any) => {
      const { user } = context;
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await User.findById(user._id);
    },
    getAllUsers: async () => {
      return await User.find(); // Fetch all users
    },
  },
  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect password');
      }

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    addUser: async (
      _: unknown,
      { username, email, password }: { username: string; email: string; password: string }
    ) => {
      const user = await User.create({ username, email, password });
      if (!user) {
        throw new UserInputError('Error creating user');
      }

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    saveBook: async (
      _: unknown,
      { bookData }: { bookData: BookInput },
      context: any
    ) => {
      const { user } = context;
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { savedBooks: bookData } },
        { new: true, runValidators: true }
      );
      return updatedUser;
    },

    removeBook: async (
      _: unknown,
      { bookId }: { bookId: string },
      context: any
    ) => {
      const { user } = context;
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
      if (!updatedUser) {
        throw new UserInputError("Couldn't find user with this id!");
      }
      return updatedUser;
    },
  },
};
