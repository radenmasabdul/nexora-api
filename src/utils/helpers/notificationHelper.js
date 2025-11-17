const prisma = require('../../../prisma/client/index.js');

// untuk membuat notification baru
const createNotification = async (userId, message) => {
  try {
    await prisma.notification.create({
      data: {
        user_id: userId,
        message,
        is_read: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// notification ketika user di-assign ke task baru
const notifyTaskAssignment = async (taskId, assignedUserId, assignerName) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true }
  });
  
  const message = `You have been assigned a new task: "${task.title}" by ${assignerName}`;
  await createNotification(assignedUserId, message);
};

// notification ketika ada comment baru pada task
const notifyNewComment = async (taskId, commenterId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedUser: { select: { id: true, name: true } },
      project: { 
        include: { 
          team: { 
            include: { 
              members: { select: { user_id: true } } 
            } 
          } 
        } 
      }
    }
  });

  const commenter = await prisma.user.findUnique({
    where: { id: commenterId },
    select: { name: true }
  });

  const message = `${commenter.name} commented on task: "${task.title}"`;
  
  if (task.assignedUser.id !== commenterId) {
    await createNotification(task.assignedUser.id, message);
  }
};

// notification ketika project baru dibuat
const notifyNewProject = async (projectId, creatorId) => {
  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: { select: { user_id: true } },
          createdBy: { select: { name: true } }
        }
      }
    }
  });

  const message = `New project "${project.name}" has been created by ${project.team.createdBy.name}`;
  
  const memberIds = project.team.members
    .map(member => member.user_id)
    .filter(id => id !== creatorId);
    
  for (const memberId of memberIds) {
    await createNotification(memberId, message);
  }
};

// notification ketika user bergabung ke team
const notifyTeamJoin = async (teamId, newMemberId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true }
  });

  const message = `Welcome to team "${team.name}"! Check out your assigned tasks and projects.`;
  await createNotification(newMemberId, message);
};

// notification ketika status task berubah
const notifyTaskStatusChange = async (taskId, newStatus, updaterName) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedUser: { select: { id: true } },
      project: {
        include: {
          team: {
            include: {
              members: { select: { user_id: true } }
            }
          }
        }
      }
    }
  });

  const message = `Task "${task.title}" status changed to ${newStatus} by ${updaterName}`;
  
  // notify assignee and team members
  const notifyIds = [task.assignedUser.id, ...task.project.team.members.map(m => m.user_id)];
  const uniqueIds = [...new Set(notifyIds)];
  
  for (const userId of uniqueIds) {
    await createNotification(userId, message);
  }
};

// notification ketika deadline project mendekat
const notifyProjectDeadline = async (projectId) => {
  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: { select: { user_id: true } }
        }
      }
    }
  });

  const message = `Project "${project.name}" deadline is approaching!`;
  
  for (const member of project.team.members) {
    await createNotification(member.user_id, message);
  }
};

// notification ketika team baru dibuat (notify admin)
const notifyTeamCreation = async (teamId, creatorId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      createdBy: { select: { name: true } }
    }
  });

  const message = `New team "${team.name}" has been created by ${team.createdBy.name}`;
  // notify all admins about new team creation
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true }
  });
  
  for (const admin of admins) {
    if (admin.id !== creatorId) {
      await createNotification(admin.id, message);
    }
  }
};

// notification ketika task dihapus
const notifyTaskDeletion = async (taskTitle, assignedUserId, deleterName) => {
  const message = `Task "${taskTitle}" has been deleted by ${deleterName}`;
  await createNotification(assignedUserId, message);
};

// notification ketika status project berubah
const notifyProjectStatusChange = async (projectId, newStatus, updaterName) => {
  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: { select: { user_id: true } }
        }
      }
    }
  });

  const message = `Project "${project.name}" status changed to ${newStatus} by ${updaterName}`;
  
  for (const member of project.team.members) {
    await createNotification(member.user_id, message);
  }
};

// notification ketika member dikeluarkan dari team
const notifyMemberRemoval = async (teamId, removedUserId, removerName) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true }
  });

  const message = `You have been removed from team "${team.name}" by ${removerName}`;
  await createNotification(removedUserId, message);
};

// notification ketika due date task mendekat
const notifyTaskDueDate = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedUser: { select: { id: true } }
    }
  });

  const message = `Task "${task.title}" is due soon! Please complete it on time.`;
  await createNotification(task.assignedUser.id, message);
};

// notification ketika comment dihapus
const notifyCommentDeletion = async (taskId, commentContent, deleterId, taskAssigneeId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true }
  });

  const deleter = await prisma.user.findUnique({
    where: { id: deleterId },
    select: { name: true }
  });

  const message = `A comment on task "${task.title}" has been deleted by ${deleter.name}`;
  
  if (taskAssigneeId !== deleterId) {
    await createNotification(taskAssigneeId, message);
  }
};

// notification ketika role member dalam team berubah
const notifyRoleChange = async (teamId, userId, newRole, changerName) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true }
  });

  const message = `Your role in team "${team.name}" has been changed to ${newRole} by ${changerName}`;
  await createNotification(userId, message);
};

// notification ketika project dihapus
const notifyProjectDeletion = async (projectName, teamId, deleterName) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { select: { user_id: true } }
    }
  });

  const message = `Project "${projectName}" has been deleted by ${deleterName}`;
  
  for (const member of team.members) {
    await createNotification(member.user_id, message);
  }
};

module.exports = {
  notifyTaskAssignment,
  notifyNewComment,
  notifyNewProject,
  notifyTeamJoin,
  notifyTaskStatusChange,
  notifyProjectDeadline,
  notifyTeamCreation,
  notifyTaskDeletion,
  notifyProjectStatusChange,
  notifyMemberRemoval,
  notifyTaskDueDate,
  notifyCommentDeletion,
  notifyRoleChange,
  notifyProjectDeletion
};