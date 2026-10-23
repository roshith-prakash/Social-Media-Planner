import prisma from "../config/prisma.js";

/**
 * AnalysisRepository — Data access layer for VideoAnalysis model.
 */
class AnalysisRepository {
  async create(data) {
    return prisma.videoAnalysis.create({ data });
  }

  async findByProjectId(projectId) {
    return prisma.videoAnalysis.findUnique({
      where: { projectId },
      include: { project: true },
    });
  }

  async findById(id) {
    return prisma.videoAnalysis.findUnique({
      where: { id },
      include: { project: true },
    });
  }

  async findByUserId(userId, { skip = 0, take = 10 } = {}) {
    return prisma.videoAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  /**
   * Update a single agent's output (for regeneration feature).
   * @param {string} id - Analysis document ID
   * @param {string} field - Agent field name (e.g. "generatedContent")
   * @param {object} data - New agent output
   */
  async updateAgentOutput(id, field, data) {
    return prisma.videoAnalysis.update({
      where: { id },
      data: { [field]: data, updatedAt: new Date() },
    });
  }

  async delete(id) {
    return prisma.videoAnalysis.delete({ where: { id } });
  }
}

export default new AnalysisRepository();
