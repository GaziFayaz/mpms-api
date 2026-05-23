import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

neonConfig.poolQueryViaFetch = true;

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mpms.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@mpms.com",
      password: hashedPassword,
      role: "admin",
      department: "Management",
      skills: ["leadership", "project management"],
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@mpms.com" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@mpms.com",
      password: hashedPassword,
      role: "manager",
      department: "Engineering",
      skills: ["typescript", "react", "nodejs"],
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@mpms.com" },
    update: {},
    create: {
      name: "Member User",
      email: "member@mpms.com",
      password: hashedPassword,
      role: "member",
      department: "Design",
      skills: ["figma", "ui/ux"],
    },
  });

  console.log("Users created:", { admin: admin.id, manager: manager.id, member: member.id });

  const project = await prisma.project.create({
    data: {
      title: "Website Redesign",
      client: "Acme Corp",
      description: "Complete redesign of the corporate website with modern design and improved UX.",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-06-30"),
      budget: 100000,
      status: "active",
    },
  });

  console.log("Project created:", project.id);

  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      title: "Design Phase",
      sprintNumber: 1,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      sortOrder: 1,
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      title: "Development Phase",
      sprintNumber: 2,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      sortOrder: 2,
    },
  });

  console.log("Sprints created:", { sprint1: sprint1.id, sprint2: sprint2.id });

  const tasks = [
    {
      projectId: project.id,
      sprintId: sprint1.id,
      title: "Create wireframes",
      description: "Design wireframes for all major pages including homepage, about, and contact.",
      status: "done",
      priority: "high",
      estimateHours: 16,
      sortOrder: 1,
    },
    {
      projectId: project.id,
      sprintId: sprint1.id,
      title: "Design system setup",
      description: "Set up design tokens, color palette, typography, and component library.",
      status: "done",
      priority: "high",
      estimateHours: 24,
      sortOrder: 2,
    },
    {
      projectId: project.id,
      sprintId: sprint2.id,
      title: "Implement homepage",
      description: "Build the homepage with responsive design, hero section, and feature highlights.",
      status: "in_progress",
      priority: "high",
      estimateHours: 32,
      sortOrder: 3,
    },
    {
      projectId: project.id,
      sprintId: sprint2.id,
      title: "Implement navigation",
      description: "Build responsive navigation with dropdown menus and mobile hamburger menu.",
      status: "todo",
      priority: "medium",
      estimateHours: 16,
      sortOrder: 4,
    },
    {
      projectId: project.id,
      sprintId: sprint2.id,
      title: "SEO optimization",
      description: "Add meta tags, structured data, sitemap, and optimize page load speed.",
      status: "todo",
      priority: "low",
      estimateHours: 8,
      sortOrder: 5,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        projectId: task.projectId,
        sprintId: task.sprintId,
        title: task.title,
        description: task.description,
        status: task.status as any,
        priority: task.priority as any,
        estimateHours: task.estimateHours,
        sortOrder: task.sortOrder,
        taskAssignees: {
          create: [
            { userId: task.priority === "high" ? manager.id : member.id },
          ],
        },
      },
    });
  }

  console.log("Tasks created: 5 tasks with assignees");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
