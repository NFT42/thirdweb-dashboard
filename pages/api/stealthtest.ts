import { NextApiRequest, NextApiResponse } from "next";
import invariant from "tiny-invariant";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(400).json({ error: "invalid method" });
  }

  invariant(process.env.STEALTHTEST_API_KEY, "missing STEALTHTEST_API_KEY");

  const result = await fetch(
    "https://staging-api.nameless.io/v1/environments",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.STEALTHTEST_API_KEY,
      },
      body: JSON.stringify({
        name: "StealthTest",
        networks: ["eth"],
        chainId: Math.floor(Math.random() * 999999),
      }),
    },
  )
    .then((res) => res.json())
    .catch((e) => {
      console.error(e);
      return res.status(500).json({ error: "internal server error" });
    });

  return res.status(201).json({ success: true, data: result.data });
};

export default handler;
