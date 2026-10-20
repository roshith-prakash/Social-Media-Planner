import prisma from "../config/prisma.js";

/**
 * VideoRepository — Data access layer for VideoProject model.
 */
class VideoRepository {
  async create(data) {
    return prisma.videoProject.create({ data });
  }

  async findById(id) {
    return prisma.videoProject.findUnique({
      where: { id },
      include: { analysis: true },
    });
  }

  async findByPublicId(cloudinaryPublicId) {
    return prisma.videoProject.findFirst({
      where: { cloudinaryPublicId },
      include: { analysis: true },
    });
  }


  async findByUserId(userId, { skip = 0, take = 20 } = {}) {
    return prisma.videoProject.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        analysis: {
          select: {
            id: true,
            strategy: true,
            qualityReview: true,
            platformRecommendations: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async countByUserId(userId) {
    return prisma.videoProject.count({ where: { userId } });
  }

  async updateStatus(id, status, errorMessage = null) {
    return prisma.videoProject.update({
      where: { id },
      data: { status, ...(errorMessage && { errorMessage }) },
    });
  }

  async linkAnalysis(id, analysisId) {
    return prisma.videoProject.update({
      where: { id },
      data: { status: "completed" },
    });
  }

  async delete(id) {
    return prisma.videoProject.delete({ where: { id } });
  }
}

export default new VideoRepository();
