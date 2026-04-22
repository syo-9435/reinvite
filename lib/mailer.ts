import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Ethereal テストアカウントをモジュールレベルでキャッシュ（開発用）
let devTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  // 本番: SMTP 環境変数が揃っていれば実際の SMTP を使用
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 開発: Ethereal Email（テスト用 SMTP）を自動セットアップ
  if (!devTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    devTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("\n📧 [Re:invite] Ethereal テストアカウントを作成しました");
    console.log(`   ユーザー: ${testAccount.user}`);
    console.log(`   メール確認: https://ethereal.email/messages\n`);
  }

  return devTransporter;
}

function buildHtml(displayName: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F3EEF4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEF4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#FF6B9D;letter-spacing:-0.5px;">Re:invite</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFCFE;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(255,107,157,0.12);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#FF6B9D,#C084FC);padding:28px 32px;">
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;">PASSWORD RESET</p>
                    <h2 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">パスワード再設定</h2>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#1E0A1E;line-height:1.6;">${displayName} さん</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#8B7A8E;line-height:1.7;">
                      パスワード再設定のリクエストを受け付けました。<br>
                      下のボタンから新しいパスワードを設定してください。
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background:#FF6B9D;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">
                            パスワードを再設定する →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="background:#FFF0F6;border-radius:12px;padding:14px 16px;border-left:3px solid #FF6B9D;">
                      <p style="margin:0;font-size:12px;color:#8B7A8E;line-height:1.6;">
                        ⏱ このリンクは <strong style="color:#1E0A1E;">1時間</strong> 有効です。<br>
                        心当たりがない場合はこのメールを無視してください。
                      </p>
                    </div>
                    <p style="margin:20px 0 0;font-size:11px;color:#8B7A8E;">
                      ボタンが開けない場合: <span style="color:#FF6B9D;word-break:break-all;">${resetUrl}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#8B7A8E;">© Re:invite · このメールは自動送信です</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface PasswordResetMailOptions {
  to: string;
  name: string | null;
  resetUrl: string;
}

export async function sendPasswordResetMail({ to, name, resetUrl }: PasswordResetMailOptions) {
  const displayName = name ?? "ユーザー";
  const from = process.env.SMTP_FROM ?? "Re:invite <noreply@reinvite.app>";
  const isDev = !process.env.SMTP_HOST;

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from,
    to,
    subject: "【Re:invite】パスワードの再設定",
    html: buildHtml(displayName, resetUrl),
    text: `${displayName} さん\n\nパスワード再設定リンク（1時間有効）:\n${resetUrl}\n\n心当たりがない場合は無視してください。`,
  });

  // 開発時: Ethereal の preview URL をコンソールに表示
  if (isDev) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("\n====================================");
    console.log("📧 [Re:invite] テストメールを送信しました");
    console.log(`   宛先: ${to}`);
    console.log(`   プレビュー: ${previewUrl}`);
    console.log("====================================\n");
  }
}
