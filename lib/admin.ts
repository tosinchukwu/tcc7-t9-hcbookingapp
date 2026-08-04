import { prisma } from "./prisma";

export async function isAdminWallet(wallet: string): Promise<boolean> {
    if (!wallet) return false;

    // Check environment variable fallback
    const envAdmin = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (wallet === envAdmin) return true;

    // Check whitelist in database
    const settings = await prisma.hospitalSettings.findFirst();
    if (!settings) return false;

    return settings.adminWallets.includes(wallet);
}