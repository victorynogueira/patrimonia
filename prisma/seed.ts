import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/security";
import { slugify } from "../src/lib/utils";
import { ROLE_PRESETS } from "../src/lib/permissions";

const PASSWORD = "Senha@123!";

async function main() {
  console.log("Limpando banco de demonstração...");
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.assetValuation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.document.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.family.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(PASSWORD);
  const professional = await prisma.user.create({
    data: { name: "Ricardo Mendes", email: "admin@patrimonia.app", passwordHash, globalRole: "PROFESSIONAL", avatarColor: "#4F46E5" },
  });
  const memberUser = await prisma.user.create({
    data: { name: "Marina Almeida", email: "marina@exemplo.com", passwordHash, globalRole: "MEMBER", avatarColor: "#EC4899" },
  });
  const viewerUser = await prisma.user.create({
    data: { name: "João Castro", email: "joao@exemplo.com", passwordHash, globalRole: "MEMBER", avatarColor: "#0EA5E9" },
  });

  const familySeeds = [
    {
      name: "Família Almeida",
      color: "#6366F1",
      description: "Patrimônio familiar, imóveis e carteira de investimentos.",
      accountNames: ["Conta corrente", "Investimentos", "Reserva de emergência"],
      assetNames: ["Apartamento Jardins", "Portfólio de ações", "Veículo familiar"],
      budgets: [["Alimentação", 250000], ["Educação", 180000], ["Lazer", 120000]],
      goals: [["Reserva de emergência", 8000000], ["Viagem familiar", 1200000]],
    },
    {
      name: "Família Castro",
      color: "#10B981",
      description: "Participações empresariais e imóveis comerciais.",
      accountNames: ["Conta PJ", "Conta pessoal"],
      assetNames: ["Galpão comercial", "Participação na Alfa Tech", "Títulos públicos"],
      budgets: [["Operação", 400000], ["Impostos", 150000]],
      goals: [["Ampliação do negócio", 15000000]],
    },
    {
      name: "Família Nogueira",
      color: "#F59E0B",
      description: "Planejamento sucessório e ativos financeiros.",
      accountNames: ["Conta conjunta", "Corretagem"],
      assetNames: ["Casa de praia", "Fundos imobiliários"],
      budgets: [["Casa", 200000], ["Saúde", 100000]],
      goals: [["Aposentadoria", 20000000]],
    },
  ];

  const expenseCategories = ["Alimentação", "Educação", "Lazer", "Saúde", "Casa", "Transporte", "Impostos", "Operação"];
  const categoryColors: Record<string, string> = {
    Alimentação: "#F97316", Educação: "#8B5CF6", Lazer: "#EC4899", Saúde: "#EF4444",
    Casa: "#14B8A6", Transporte: "#0EA5E9", Impostos: "#64748B", Operação: "#6366F1",
  };
  const today = new Date();

  for (const [familyIndex, seed] of familySeeds.entries()) {
    const family = await prisma.family.create({
      data: {
        name: seed.name,
        slug: `${slugify(seed.name)}-${familyIndex + 1}`,
        description: seed.description,
        color: seed.color,
        ownerId: professional.id,
        features: JSON.stringify({ reports: true, insights: true, documents: true }),
      },
    });

    await prisma.familyMember.create({
      data: { familyId: family.id, userId: professional.id, role: "ADMIN", permissions: "" },
    });
    if (familyIndex === 0) {
      await prisma.familyMember.create({
        data: {
          familyId: family.id,
          userId: memberUser.id,
          role: "MEMBER",
          permissions: JSON.stringify(ROLE_PRESETS.MEMBER),
        },
      });
    }
    if (familyIndex === 1) {
      await prisma.familyMember.create({
        data: { familyId: family.id, userId: viewerUser.id, role: "VIEWER", permissions: "" },
      });
    }

    const accounts = [];
    for (const [index, name] of seed.accountNames.entries()) {
      accounts.push(
        await prisma.account.create({
          data: {
            familyId: family.id,
            name,
            type: index === 1 ? "INVESTMENT" : "BANK",
            institution: ["Itaú", "XP Investimentos", "Nubank"][index] ?? "Banco",
            balanceCents: [4850000, 12800000, 2400000][index] ?? 1000000,
            color: ["#6366F1", "#10B981", "#F59E0B"][index] ?? "#6366F1",
          },
        }),
      );
    }

    const categories = [];
    for (const name of expenseCategories) {
      categories.push(
        await prisma.category.create({
          data: { familyId: family.id, name, type: "EXPENSE", color: categoryColors[name], icon: "circle" },
        }),
      );
    }
    const incomeCategory = await prisma.category.create({
      data: { familyId: family.id, name: "Rendimentos", type: "INCOME", color: "#22C55E" },
    });
    const profitCategory = await prisma.category.create({
      data: { familyId: family.id, name: "Lucros e dividendos", type: "PROFIT", color: "#14B8A6" },
    });

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const base = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
      const month = base.getMonth();
      const salary = 1200000 + familyIndex * 250000 + monthOffset * 12000;
      await prisma.transaction.create({
        data: {
          familyId: family.id,
          accountId: accounts[0].id,
          categoryId: incomeCategory.id,
          type: "INCOME",
          amountCents: salary,
          description: "Rendimentos mensais",
          notes: "Salário e rendimentos recorrentes",
          date: new Date(base.getFullYear(), month, 5),
          isRecurring: true,
          recurrence: "MONTHLY",
          createdById: professional.id,
        },
      });
      await prisma.transaction.create({
        data: {
          familyId: family.id,
          accountId: accounts[1].id,
          categoryId: profitCategory.id,
          type: "PROFIT",
          amountCents: 180000 + Math.round(Math.random() * 90000) + familyIndex * 40000,
          description: "Dividendos recebidos",
          date: new Date(base.getFullYear(), month, 15),
          createdById: professional.id,
        },
      });
      for (let i = 0; i < 12; i++) {
        const category = categories[(i + monthOffset + familyIndex) % categories.length];
        const amount = 18000 + ((i * 137 + monthOffset * 211) % 95000);
        await prisma.transaction.create({
          data: {
            familyId: family.id,
            accountId: accounts[i % accounts.length].id,
            categoryId: category.id,
            type: "EXPENSE",
            amountCents: amount,
            description: ["Supermercado", "Mensalidade escolar", "Combustível", "Manutenção da casa", "Plano de saúde", "Assinatura de streaming", "IPTU", "Despesa operacional"][i % 8],
            date: new Date(base.getFullYear(), month, 3 + ((i * 2) % 24)),
            isRecurring: i % 4 === 0,
            recurrence: i % 4 === 0 ? "MONTHLY" : null,
            createdById: i % 3 === 0 && familyIndex === 0 ? memberUser.id : professional.id,
          },
        });
      }
    }

    for (const [index, name] of seed.assetNames.entries()) {
      const acquisition = 35000000 + index * 12000000 + familyIndex * 4000000;
      const current = Math.round(acquisition * (1 + (index - 1) * 0.08 + familyIndex * 0.03));
      const asset = await prisma.asset.create({
        data: {
          familyId: family.id,
          type: index === 0 ? "REAL_ESTATE" : index === 1 ? "INVESTMENT" : index === 2 ? "VEHICLE" : "BUSINESS",
          name,
          description: "Bem registrado no patrimônio familiar",
          acquisitionValueCents: acquisition,
          currentValueCents: current,
          acquisitionDate: new Date(2021 + index, 3 + index, 12),
          location: index === 0 ? "São Paulo, SP" : null,
        },
      });
      await prisma.assetValuation.createMany({
        data: [0, 1, 2].map((year) => ({
          assetId: asset.id,
          valueCents: Math.round(acquisition * (1 + (year * 0.06 + index * 0.02))),
          date: new Date(2023 + year, 11, 20),
          notes: `Avaliação anual ${2023 + year}`,
        })),
      });
    }

    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    for (const [name, limit] of seed.budgets) {
      const category = categories.find((item) => item.name === name);
      await prisma.budget.create({ data: { familyId: family.id, categoryId: category?.id ?? null, month: currentMonth, limitCents: Number(limit) } });
    }
    for (const [name, target] of seed.goals) {
      await prisma.goal.create({
        data: { familyId: family.id, name: String(name), targetCents: Number(target), currentCents: Math.round(Number(target) * (0.35 + familyIndex * 0.12)), deadline: new Date(today.getFullYear() + 2, 11, 31), color: family.color },
      });
    }

    const doc = await prisma.document.create({
      data: {
        familyId: family.id,
        name: "Resumo patrimonial.pdf",
        mimeType: "text/plain",
        sizeBytes: 72,
        data: Buffer.from("Documento de demonstracao - Patrimonia"),
        uploadedById: professional.id,
      },
    });
    await prisma.transaction.updateMany({
      where: { familyId: family.id, type: "INCOME" },
      data: { documentId: doc.id },
    });

    await prisma.notification.createMany({
      data: [
        { familyId: family.id, userId: professional.id, title: "Relatório mensal disponível", body: `O demonstrativo de ${family.name} já pode ser consultado.`, type: "INFO" },
        { familyId: family.id, userId: professional.id, title: "Variação patrimonial", body: "Os ativos da família tiveram valorização no último trimestre.", type: "SUCCESS" },
      ],
    });
    await prisma.auditLog.createMany({
      data: [
        { familyId: family.id, actorId: professional.id, action: "CREATE", entity: "Family", entityId: family.id, details: JSON.stringify({ name: family.name }) },
        { familyId: family.id, actorId: professional.id, action: "CREATE", entity: "Asset", details: JSON.stringify({ count: seed.assetNames.length }) },
      ],
    });
  }

  console.log("Seed concluído.");
  console.log("Profissional: admin@patrimonia.app | " + PASSWORD);
  console.log("Integrante:  marina@exemplo.com | " + PASSWORD);
  console.log("Leitor:      joao@exemplo.com | " + PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
