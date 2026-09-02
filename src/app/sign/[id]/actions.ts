"use server";
import prisma from "@/lib/prisma";

export async function getContract(id: string) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { company: true },
    });
    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signContract(id: string, signatureBase64: string, clientIp: string) {
  try {
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signatureData: signatureBase64,
        clientIp: clientIp,
      },
    });
    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
