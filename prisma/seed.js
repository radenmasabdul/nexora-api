const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function pick(arr, i) { return arr[i % arr.length]; }
function pad(n, len = 4) { return String(n).padStart(len, '0'); }

const PROJECT_NAMES_A = [
  'Platform Redesign','Mobile App Development','Data Pipeline','Admin Dashboard',
  'Authentication System','Reporting Module','Notification Service','Payment Integration',
  'Search Engine','Analytics Dashboard','CMS Development','API Gateway',
  'User Management','File Storage Service','Email Automation','Inventory System',
  'Ticketing Platform','Customer Portal','Audit Trail Module','Workflow Engine',
  'Document Management','Integration Hub','Scheduler Service','Feedback System',
  'Onboarding Flow','Knowledge Base',
];

const PROJECT_NAMES_B = [
  'Performance Upgrade','Security Hardening','CI/CD Pipeline','Microservices Migration',
  'Database Optimization','Cloud Infrastructure','Monitoring System','Cache Layer',
  'Load Balancer Setup','Backup Automation','Logging Service','Rate Limiter',
  'Service Discovery','Config Management','Health Check System','Disaster Recovery',
  'Zero Downtime Deploy','Container Orchestration','Secret Management','Network Hardening',
  'Cost Optimization','Auto Scaling Setup','Edge Caching','Dependency Audit',
  'Data Archiving','Compliance Tooling',
];

const TASK_NAMES = [
  'Requirement Analysis','UI Wireframing','Database Design','API Development',
  'Frontend Implementation','Unit Testing','Integration Testing','Code Review',
  'Documentation','Deployment Setup','Performance Optimization','Security Audit',
  'Bug Fixing','User Acceptance Testing','Release Preparation','Stakeholder Demo',
];

const STATUSES        = ['planning','in_progress','on_hold','completed'];
const TASK_STATUSES   = ['to_do','in_progress','review','done'];
const TASK_PRIORITIES = ['low','medium','high'];
const COMMENTS = [
  'Sudah selesai dikerjakan, mohon di-review.',
  'Ada beberapa poin yang perlu didiskusikan lebih lanjut.',
  'Progress berjalan sesuai jadwal.',
  'Menemukan beberapa bug minor, sedang diperbaiki.',
  'Dokumentasi sudah diperbarui.',
  'Butuh klarifikasi dari tim backend.',
  'Testing sudah selesai, tidak ada issue.',
  'Perlu update dependensi terlebih dahulu.',
  'Design sudah disetujui oleh stakeholder.',
  'Deployment ke staging berhasil.',
];

async function main() {
  console.log('🌱 Starting NEXORA seed...\n');

  // ── Load users by role ───────────────────────────────────────────────────
  console.log('🔍 Loading users from database...');

  const [managers, owners, staffList] = await Promise.all([
    prisma.user.findMany({ where: { role: 'manager_division' }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: 'project_owner' },   select: { id: true } }),
    prisma.user.findMany({ where: { role: 'staff' },           select: { id: true } }),
  ]);

  console.log(`   managers: ${managers.length} | owners: ${owners.length} | staff: ${staffList.length}\n`);

  const NUM_TEAMS     = managers.length;
  const ownersPerTeam = Math.ceil(owners.length    / NUM_TEAMS);
  const staffPerTeam  = Math.ceil(staffList.length / NUM_TEAMS);

  // ── 1. TEAMS ─────────────────────────────────────────────────────────────
  console.log(`📦 Seeding ${NUM_TEAMS} teams...`);

  const teams = [];

  for (let i = 0; i < NUM_TEAMS; i++) {
    const mgr      = managers[i];
    const teamName = `${mgr.name.split(' ')[0]} Team ${pad(i + 1, 2)}`;
    const team     = await prisma.team.upsert({
      where:  { name: teamName },
      update: {},
      create: {
        name:          teamName,
        description:   `Tim dipimpin oleh ${mgr.name}. Fokus pada pengembangan produk digital berkualitas tinggi.`,
        created_by_id: mgr.id,
      },
    });

    teams.push(team);
  }

  console.log(`   ✅ ${teams.length} teams\n`);

  // ── 2. TEAM MEMBERS ──────────────────────────────────────────────────────
  console.log('👥 Seeding team members...');

  let memberCount = 0;

  for (let t = 0; t < NUM_TEAMS; t++) {
    const team       = teams[t];
    const ownerSlice = owners.slice(t * ownersPerTeam,  (t + 1) * ownersPerTeam);
    const staffSlice = staffList.slice(t * staffPerTeam, (t + 1) * staffPerTeam);

    for (const o of ownerSlice) {
      await prisma.teamMember.upsert({
        where:  { team_id_user_id: { team_id: team.id, user_id: o.id } },
        update: {},
        create: { team_id: team.id, user_id: o.id, role: 'project_owner' },
      });

      memberCount++;
    }

    for (let s = 0; s < staffSlice.length; s++) {
      await prisma.teamMember.upsert({
        where:  { team_id_user_id: { team_id: team.id, user_id: staffSlice[s].id } },
        update: {},
        create: { team_id: team.id, user_id: staffSlice[s].id, role: s === 0 ? 'team_leader' : 'developer' },
      });

      memberCount++;
    }
  }

  console.log(`   ✅ ${memberCount} members\n`);

  // ── 3. PROJECTS ──────────────────────────────────────────────────────────
  console.log('🗂  Seeding 2 projects per team...');

  const projects = [];

  for (let t = 0; t < NUM_TEAMS; t++) {
    const team       = teams[t];
    const ownerSlice = owners.slice(t * ownersPerTeam, (t + 1) * ownersPerTeam);
    const creatorId  = ownerSlice[0]?.id ?? managers[t].id;

    const pA = await prisma.project.upsert({
      where:  { team_id_name: { team_id: team.id, name: pick(PROJECT_NAMES_A, t) } },
      update: {},
      create: {
        team_id:     team.id,
        name:        pick(PROJECT_NAMES_A, t),
        description: `Proyek utama untuk ${team.name}. Mencakup seluruh siklus dari perencanaan hingga deployment.`,
        status:      pick(STATUSES, t),
        deadline:    new Date(2026, 5 + (t % 6), 15),
        created_by:  creatorId,
      },
    });

    const pB = await prisma.project.upsert({
      where:  { team_id_name: { team_id: team.id, name: pick(PROJECT_NAMES_B, t) } },
      update: {},
      create: {
        team_id:     team.id,
        name:        pick(PROJECT_NAMES_B, t),
        description: `Proyek infrastruktur untuk ${team.name}. Fokus pada stabilitas dan keamanan sistem.`,
        status:      pick(STATUSES, t + 1),
        deadline:    new Date(2026, 8 + (t % 4), 30),
        created_by:  creatorId,
      },
    });

    projects.push(pA, pB);
  }

  console.log(`   ✅ ${projects.length} projects\n`);

  // ── 4. TASKS ─────────────────────────────────────────────────────────────
  console.log('✅ Seeding 4 tasks per project...');

  const tasks = [];
  
  for (let p = 0; p < projects.length; p++) {
    const project    = projects[p];
    const teamIdx    = Math.floor(p / 2);
    const ownerSlice = owners.slice(teamIdx * ownersPerTeam,  (teamIdx + 1) * ownersPerTeam);
    const staffSlice = staffList.slice(teamIdx * staffPerTeam, (teamIdx + 1) * staffPerTeam);
    const creatorId  = ownerSlice[0]?.id ?? managers[teamIdx].id;

    for (let k = 0; k < 4; k++) {
      const stableId   = `seed-task-${pad(p * 4 + k + 1)}`;
      const assigneeId = staffSlice.length > 0 ? staffSlice[k % staffSlice.length].id : null;
      const task = await prisma.task.upsert({
        where:  { id: stableId },
        update: {},
        create: {
          id:          stableId,
          project_id:  project.id,
          title:       pick(TASK_NAMES, p * 4 + k),
          description: `Detail pekerjaan untuk task "${pick(TASK_NAMES, p * 4 + k)}" pada proyek ${project.name}.`,
          priority:    pick(TASK_PRIORITIES, k),
          status:      pick(TASK_STATUSES, k),
          due_date:    new Date(2026, 4 + (k % 8), 10 + k),
          assign_to:   assigneeId,
          created_by:  creatorId,
        },
      });

      tasks.push(task);
    }
  }

  console.log(`   ✅ ${tasks.length} tasks\n`);

  // ── 5. COMMENTS ──────────────────────────────────────────────────────────
  console.log('💬 Seeding 2 comments per task...');

  let commentCount = 0;
  
  for (let i = 0; i < tasks.length; i++) {
    const task       = tasks[i];
    const teamIdx    = Math.floor(Math.floor(i / 4) / 2);
    const staffSlice = staffList.slice(teamIdx * staffPerTeam, (teamIdx + 1) * staffPerTeam);

    for (let c = 0; c < 2; c++) {
      const stableId = `seed-comment-${pad(i * 2 + c + 1, 5)}`;
      const authorId = staffSlice.length > 0
        ? staffSlice[(i + c) % staffSlice.length].id
        : managers[teamIdx % managers.length].id;

      await prisma.comment.upsert({
        where:  { id: stableId },
        update: {},
        create: {
          id:      stableId,
          task_id: task.id,
          user_id: authorId,
          content: pick(COMMENTS, i + c),
        },
      });

      commentCount++;
    }
  }

  console.log(`   ✅ ${commentCount} comments\n`);

  // ── 6. ACTIVITY LOGS ────────────────────────────────────────────────────
  console.log('📋 Seeding activity logs...');

  let logCount = 0;

  for (let t = 0; t < teams.length; t++) {
    await prisma.activityLog.upsert({
      where:  { id: `seed-log-team-${pad(t + 1, 3)}` },
      update: {},
      create: { id: `seed-log-team-${pad(t + 1, 3)}`, user_id: managers[t].id, action: 'team_created', entity_type: 'team', entity_id: teams[t].id },
    });

    logCount++;
  }

  for (let p = 0; p < projects.length; p++) {
    const teamIdx    = Math.floor(p / 2);
    const ownerSlice = owners.slice(teamIdx * ownersPerTeam, (teamIdx + 1) * ownersPerTeam);

    await prisma.activityLog.upsert({
      where:  { id: `seed-log-proj-${pad(p + 1, 3)}` },
      update: {},
      create: { id: `seed-log-proj-${pad(p + 1, 3)}`, user_id: ownerSlice[0]?.id ?? managers[teamIdx].id, action: 'project_created', entity_type: 'project', entity_id: projects[p].id },
    });

    logCount++;
  }

  for (let i = 0; i < tasks.length; i++) {
    const teamIdx    = Math.floor(Math.floor(i / 4) / 2);
    const ownerSlice = owners.slice(teamIdx * ownersPerTeam, (teamIdx + 1) * ownersPerTeam);

    await prisma.activityLog.upsert({
      where:  { id: `seed-log-task-${pad(i + 1)}` },
      update: {},
      create: { id: `seed-log-task-${pad(i + 1)}`, user_id: ownerSlice[0]?.id ?? managers[teamIdx].id, action: 'task_created', entity_type: 'task', entity_id: tasks[i].id },
    });

    logCount++;
  }

  console.log(`   ✅ ${logCount} activity logs\n`);

  // ── 7. NOTIFICATIONS ────────────────────────────────────────────────────
  console.log('🔔 Seeding notifications...');

  let notifCount = 0;

  for (let t = 0; t < teams.length; t++) {
    await prisma.notification.upsert({
      where:  { id: `seed-notif-team-${pad(t + 1, 3)}` },
      update: {},
      create: { id: `seed-notif-team-${pad(t + 1, 3)}`, user_id: managers[t].id, message: `Tim "${teams[t].name}" berhasil dibuat.`, is_read: t % 2 === 0 },
    });

    notifCount++;
  }

  for (let p = 0; p < projects.length; p++) {
    const teamIdx    = Math.floor(p / 2);
    const ownerSlice = owners.slice(teamIdx * ownersPerTeam, (teamIdx + 1) * ownersPerTeam);

    if (!ownerSlice[0]) continue;

    await prisma.notification.upsert({
      where:  { id: `seed-notif-proj-${pad(p + 1, 3)}` },
      update: {},
      create: { id: `seed-notif-proj-${pad(p + 1, 3)}`, user_id: ownerSlice[0].id, message: `Anda ditugaskan sebagai penanggung jawab proyek "${projects[p].name}".`, is_read: p % 3 === 0 },
    });

    notifCount++;
  }

  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i].assign_to) continue;

    await prisma.notification.upsert({
      where:  { id: `seed-notif-task-${pad(i + 1)}` },
      update: {},
      create: { id: `seed-notif-task-${pad(i + 1)}`, user_id: tasks[i].assign_to, message: `Task "${tasks[i].title}" telah ditugaskan kepada Anda.`, is_read: i % 4 === 0 },
    });
    
    notifCount++;
  }
  console.log(`   ✅ ${notifCount} notifications\n`);

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('🎉 Seed completed successfully!');
  console.log(`   Teams         : ${teams.length}`);
  console.log(`   Team Members  : ${memberCount}`);
  console.log(`   Projects      : ${projects.length}`);
  console.log(`   Tasks         : ${tasks.length}`);
  console.log(`   Comments      : ${commentCount}`);
  console.log(`   Activity Logs : ${logCount}`);
  console.log(`   Notifications : ${notifCount}`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });