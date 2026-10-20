/**
 * Transactional email service for Zerem VIP subscriptions.
 * Supports Resend API with graceful fallback logging.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured. Email to", to, "subject:", subject);
    return { success: false, error: "RESEND_API_KEY_MISSING" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zerem VIP <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text: text ?? subject,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[email] Resend error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    console.error("[email] Network/exception sending email:", err);
    return { success: false, error: err.message || "Email exception" };
  }
}

export async function sendVipWelcomeEmail(params: {
  to: string;
  name?: string;
  authCode: string;
  expiresAt: string;
  method: string;
}) {
  const { to, name, authCode, expiresAt, method } = params;
  const displayName = name?.trim() || to.split("@")[0] || "חבר VIP";

  const formattedDate = new Date(expiresAt).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const subject = "👑 ברוך הבא ל-Zerem VIP Pro! המנוי הופעל בהצלחה ל-30 יום";
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #1e293b; border-radius: 28px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); text-align: center; border-bottom: 1px solid #334155;">
              <div style="display: inline-block; background: #fbbf24; color: #020617; font-size: 11px; font-weight: 900; padding: 4px 14px; border-radius: 9999px; letter-spacing: 1px; margin-bottom: 14px; text-transform: uppercase;">
                VIP PRO MEMBER
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; line-height: 1.2;">
                ברוך הבא ל-Zerem VIP! 👑
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8; font-weight: 500;">
                שלום ${displayName}, המנוי שלך הופעל בהצלחה לחודש שלם
              </p>
            </td>
          </tr>

          <!-- Receipt & Details Card -->
          <tr>
            <td style="padding: 28px 32px;">
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px; color: #cbd5e1;">
                  <tr>
                    <td style="color: #64748b;">סוג מנוי:</td>
                    <td align="left" style="font-weight: 800; color: #f59e0b;">Zerem VIP Pro (חודשי)</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">סכום ששולם:</td>
                    <td align="left" style="font-weight: 800; color: #ffffff;">₪9.90</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">אמצעי אימות:</td>
                    <td align="left" style="font-weight: 700; color: #38bdf8;">${method}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">מספר אסמכתא:</td>
                    <td align="left" style="font-family: monospace; font-weight: 800; color: #e2e8f0;">${authCode}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">בתוקף עד:</td>
                    <td align="left" style="font-weight: 800; color: #10b981;">${formattedDate} (30 יום)</td>
                  </tr>
                </table>
              </div>

              <!-- VIP Benefits List -->
              <h3 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 800; color: #ffffff;">
                ההטבות הפעילות בחשבונך:
              </h3>
              
              <table width="100%" cellspacing="0" cellpadding="8" style="font-size: 13px; color: #cbd5e1; margin-bottom: 28px;">
                <tr>
                  <td width="30" style="vertical-align: top; font-size: 18px;">⚡</td>
                  <td>
                    <strong style="color: #ffffff;">התראות עומס בלייב</strong><br>
                    <span style="font-size: 12px; color: #94a3b8;">התראות מוקדמות לפני יציאה לקניות ומצב עומס בסופרים סביבך.</span>
                  </td>
                </tr>
                <tr>
                  <td width="30" style="vertical-align: top; font-size: 18px;">🏢</td>
                  <td>
                    <strong style="color: #ffffff;">הוספת סופרים אישיים למפה</strong><br>
                    <span style="font-size: 12px; color: #94a3b8;">אפשרות להוסיף כל מכולת או סניף שלא מופיע ברשימה.</span>
                  </td>
                </tr>
                <tr>
                  <td width="30" style="vertical-align: top; font-size: 18px;">👑</td>
                  <td>
                    <strong style="color: #ffffff;">תג VIP בקהילה ומשקל כפול</strong><br>
                    <span style="font-size: 12px; color: #94a3b8;">הדיווחים שלך מתעדכנים בעדיפות גבוהה ועם סימון VIP ייחודי.</span>
                  </td>
                </tr>
              </table>

              <!-- Renewal notice callout -->
              <div style="background-color: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; padding: 14px 18px; margin-bottom: 26px;">
                <p style="margin: 0; font-size: 12px; color: #fde68a; line-height: 1.5;">
                  <strong>🔔 התראת סיום מנוי:</strong> בתום 30 הימים המנוי יתאפס אוטומטית. אנו נשלח לך מייל תזכורת מסודר עם קישור ישיר ומהיר לחידוש המנוי.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="https://superlive-ashen.vercel.app" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 16px 28px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);">
                  פתח את Zerem באפליקציה ←
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
              <p style="margin: 0;">Zerem (זרם) · אפליקציית עומס הסופרמרקטים החכמה בישראל</p>
              <p style="margin: 4px 0 0 0;">קיבלת מייל זה בעקבות שדרוג מנוי ל-Zerem VIP Pro.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({ to, subject, html });
}

export async function sendVipExpiryAlertEmail(params: {
  to: string;
  name?: string;
  expiresAt: string;
}) {
  const { to, name, expiresAt } = params;
  const displayName = name?.trim() || to.split("@")[0] || "חבר VIP";

  const formattedDate = new Date(expiresAt).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const subject = "⏳ מנוי ה-Zerem VIP שלך עומד להסתיים — קישור ישיר לחידוש";
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #1e293b; border-radius: 28px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; background: linear-gradient(135deg, #1e1b4b 0%, #31102b 100%); text-align: center; border-bottom: 1px solid #334155;">
              <div style="display: inline-block; background: #f43f5e; color: #ffffff; font-size: 11px; font-weight: 900; padding: 4px 14px; border-radius: 9999px; letter-spacing: 1px; margin-bottom: 14px; text-transform: uppercase;">
                EXPIRATION NOTICE
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; line-height: 1.2;">
                מנוי ה-VIP שלך עומד לפוג ⏳
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1; font-weight: 500;">
                שלום ${displayName}, תקופת 30 הימים שלך מסתיימת ב-${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                כדי להמשיך ליהנות מגישה ישירה להתראות עומס מוקדמות, ניווט מדויק, הוספת סופרים אישיים ותג ה-VIP, תוכל לחדש את המנוי ב-<strong>₪9.90</strong> לחודש נוסף בלחיצה אחת:
              </p>

              <!-- Action Buttons -->
              <div style="margin-bottom: 24px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <a href="https://www.bitpay.co.il/app/share-info?i=Eok7YIlA&j=true" target="_blank" style="display: block; background: #2563eb; color: #ffffff; text-decoration: none; text-align: center; font-size: 14px; font-weight: 800; padding: 14px; border-radius: 14px;">
                        חדש ב-Bit (₪9.90) ↗
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <a href="https://links.payboxapp.com/0DhDWFtCo7b" target="_blank" style="display: block; background: #0284c7; color: #ffffff; text-decoration: none; text-align: center; font-size: 14px; font-weight: 800; padding: 14px; border-radius: 14px;">
                        חדש ב-PayBox (₪9.90) ↗
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
                  לאחר ביצוע התשלום, חזרו לאפליקציה להפעלת החודש החדש:
                </p>
                <a href="https://superlive-ashen.vercel.app" target="_blank" style="color: #38bdf8; font-size: 13px; font-weight: 700; text-decoration: underline;">
                  כניסה לאפליקציית Zerem ←
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
              <p style="margin: 0;">Zerem (זרם) · שירות לקוחות ומנויים</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({ to, subject, html });
}
