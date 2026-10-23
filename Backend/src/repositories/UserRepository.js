import prisma from "../config/prisma.js";

/**
 * UserRepository — Data access layer for User model.
 * All database operations for users go through here.
 */
class UserRepository {
  async findByFirebaseUID(firebaseUID) {
    return prisma.user.findUnique({ where: { firebaseUID } });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data) {
    return prisma.user.create({ data });
  }

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }

  async incrementAnalysisCount(id) {
    return prisma.user.update({
      where: { id },
      data: { totalAnalyses: { increment: 1 } },
    });
  }
}

export default new UserRepository();
