import { intentarPush } from "@/lib/push-notify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.TEST_PUSH_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  if (!email && !phone) {
    return Response.json(
      { error: "email o phone requerido" },
      { status: 400 }
    );
  }

  const resultado = await intentarPush(
    { email: email ?? undefined, phone: phone ?? undefined },
    "Prueba RescueChip",
    "Si ves esto, el push funciona correctamente 🎉",
    { test: true }
  );

  return Response.json({ success: resultado });
}
