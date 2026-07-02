import prisma from "../config/prisma.js";

/**
 * DraftRepository — Data access layer for SavedDraft model.
 */
class DraftRepository {
  async create(data) {
    return prisma.savedDraft.create({ data });
  }

  async findById(id) {
    return prisma.savedDraft.findUnique({ where: { id } });
  }

  async findByUserId(userId, { skip = 0, take = 20 } = {}) {
    return prisma.savedDraft.findMany({
      where: { userId },
      orderBy: [{ isFavorited: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    });
  }

  async findByAnalysisId(analysisId) {
    return prisma.savedDraft.findMany({
      where: { analysisId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id, data) {
    return prisma.savedDraft.update({ where: { id }, data });
  }

  async toggleFavorite(id, currentValue) {
    return prisma.savedDraft.update({
      where: { id },
      data: { isFavorited: !currentValue },
    });
  }

  async delete(id) {
    return prisma.savedDraft.delete({ where: { id } });
  }

  async countByUserId(userId) {
    return prisma.savedDraft.count({ where: { userId } });
  }
}

export default new DraftRepository();
