import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";
import { readStoredFile } from "@/lib/stored-files";
import { isSafeCloudinaryStoredUrl, isSafePrivateStoredUploadUrl } from "@/lib/upload-policy";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const authError = await requireAdminRequest(req);
    if (authError) return authError;

    try {
        const files = await prisma.productFile.findMany({
            include: { product: true }
        });

        const results: Array<{ id: string; title: string; url: string; mimeType: string; size: number; productTitle?: string | null; isCloudinary: boolean; isLocal: boolean; reachable: boolean; error: string | null; actualSize: number }> = [];
        for (const file of files) {
            const isCloudinary = isSafeCloudinaryStoredUrl(file.url);
            const isLocal = file.url.startsWith("/private-uploads/");

            let reachable = false;
            let error: string | null = null;
            let fileSize = 0;

            try {
                const stored = await readStoredFile({
                    title: file.title,
                    url: file.url,
                    mimeType: file.mimeType
                });
                reachable = stored.data.length > 0;
                fileSize = stored.data.length;
            } catch (e) {
                error = e instanceof Error ? e.message : "Unknown error";
            }

            results.push({
                id: file.id,
                title: file.title,
                url: file.url,
                mimeType: file.mimeType,
                size: file.size,
                productTitle: file.product?.title,
                isCloudinary,
                isLocal,
                reachable,
                error,
                actualSize: fileSize
            });
        }

        return NextResponse.json({ files: results });
    } catch (error) {
        await reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
        return NextResponse.json({ error: "Failed to diagnose files" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authError = await requireAdminRequest(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { fileId, action } = body;

        if (!fileId || !action) {
            return NextResponse.json({ error: "fileId and action are required" }, { status: 400 });
        }

        const file = await prisma.productFile.findUnique({
            where: { id: fileId },
            include: { product: true }
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        if (action === "reupload") {
            // Download the file from current location
            let fileBuffer: Buffer;
            try {
                const stored = await readStoredFile({
                    title: file.title,
                    url: file.url,
                    mimeType: file.mimeType
                });
                fileBuffer = stored.data;
            } catch (e) {
                return NextResponse.json({ error: `Cannot read source file: ${e instanceof Error ? e.message : "Unknown error"}` }, { status: 400 });
            }

            // Upload to Cloudinary
            const cloudinaryConfig = getCloudinaryConfig();
            if (!cloudinaryConfig) {
                return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
            }

            const policy = { private: true, kind: "document" as const, label: "PDF", extensions: [".pdf"], mimeTypes: ["application/pdf"] };
            const upload = await uploadToCloudinary({
                bytes: fileBuffer,
                fileName: file.title,
                mimeType: file.mimeType,
                policy
            });

            // Update database with new Cloudinary URL
            const updated = await prisma.productFile.update({
                where: { id: fileId },
                data: { url: upload.secureUrl, size: upload.bytes }
            });

            return NextResponse.json({
                ok: true,
                message: "File re-uploaded to Cloudinary",
                oldUrl: file.url,
                newUrl: updated.url
            });
        }

        if (action === "verify") {
            try {
                const stored = await readStoredFile({
                    title: file.title,
                    url: file.url,
                    mimeType: file.mimeType
                });
                return NextResponse.json({
                    ok: true,
                    reachable: stored.data.length > 0,
                    size: stored.data.length
                });
            } catch (e) {
                return NextResponse.json({
                    ok: false,
                    reachable: false,
                    error: e instanceof Error ? e.message : "Unknown error"
                });
            }
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        await reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}