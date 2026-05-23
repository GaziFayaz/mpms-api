import { prisma } from "../../lib/prisma.js";

export class ReportsService {
  async projectReport(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, status: true },
    });
    if (!project) throw new Error("Project not found");

    const tasks = await prisma.task.findMany({ where: { projectId } });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;

    const totalHours = await prisma.timeLog.aggregate({
      where: { task: { projectId } },
      _sum: { hours: true },
    });

    const tasksByStatus = await prisma.task.groupBy({
      by: ["status"],
      where: { projectId },
      _count: true,
    });

    const tasksBySprint = await prisma.task.groupBy({
      by: ["sprintId"],
      where: { projectId },
      _count: true,
    });

    const sprintIds = tasksBySprint.map((s) => s.sprintId).filter(Boolean) as string[];
    const sprints = await prisma.sprint.findMany({
      where: { id: { in: sprintIds } },
      select: { id: true, title: true },
    });

    return {
      project,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress_percent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      total_hours_logged: totalHours._sum.hours ?? 0,
      tasks_by_status: tasksByStatus.map((s) => ({ status: s.status, count: s._count })),
      tasks_by_sprint: tasksBySprint
        .filter((s) => s.sprintId)
        .map((s) => {
          const sprint = sprints.find((sp) => sp.id === s.sprintId);
          return {
            sprint_id: s.sprintId,
            sprint_title: sprint?.title ?? "Unknown",
            total: s._count,
            completed: tasks.filter((t) => t.sprintId === s.sprintId && t.status === "done").length,
          };
        }),
    };
  }

  async userReport(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new Error("User not found");

    const taskAssignees = await prisma.taskAssignee.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            project: { select: { id: true, title: true } },
          },
        },
      },
    });

    const totalHours = await prisma.timeLog.aggregate({
      where: { userId },
      _sum: { hours: true },
    });

    const tasksByStatus: Record<string, number> = {};
    const projectsInvolved: Set<string> = new Set();
    const projectNames: Record<string, string> = {};

    for (const ta of taskAssignees) {
      const status = ta.task.status;
      tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
      projectsInvolved.add(ta.task.projectId);
      projectNames[ta.task.projectId] = ta.task.project.title;
    }

    return {
      user,
      assigned_tasks: taskAssignees.length,
      tasks_by_status: Object.entries(tasksByStatus).map(([status, count]) => ({ status, count })),
      total_hours: totalHours._sum.hours ?? 0,
      projects_involved: Array.from(projectsInvolved).map((id) => ({
        id,
        title: projectNames[id] ?? "Unknown",
      })),
    };
  }

  async overview() {
    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "done" },
          select: { id: true },
        },
      },
    });

    return projects.map((p) => ({
      id: p.id,
      title: p.title,
      client: p.client,
      status: p.status,
      total_tasks: p._count.tasks,
      completed_tasks: p.tasks.length,
      progress_percent:
        p._count.tasks > 0 ? Math.round((p.tasks.length / p._count.tasks) * 100) : 0,
    }));
  }
}

export const reportsService = new ReportsService();
