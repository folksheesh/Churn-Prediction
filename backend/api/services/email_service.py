"""
Shared email utility menggunakan Resend API.
Digunakan oleh auth (OTP) dan mitigation (campaign notification).
"""
import os
import httpx

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Kirim email via Resend API.
    Returns True jika berhasil, False jika tidak ada API key.
    Raise RuntimeError jika ada error.
    """
    # Baca env var di sini (lazy) supaya selalu dapat nilai terbaru
    api_key = os.getenv("RESEND_API_KEY")
    from_addr = os.getenv("RESEND_FROM", "ChurnSense <noreply@churnsense.sbs>")

    if not api_key:
        print(f"[Email] RESEND_API_KEY not set — skipping email to {to_email}")
        return False

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_addr,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            },
            timeout=15,
        )
        print(f"[Resend] status={response.status_code} to={to_email} body={response.text}")
        if response.status_code in (200, 201):
            return True
        else:
            raise RuntimeError(f"Resend API error {response.status_code}: {response.text}")
    except httpx.RequestError as e:
        raise RuntimeError(f"Network error calling Resend API: {e}")
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"{type(e).__name__}: {e}")


# ── Campaign Email Templates ─────────────────────────────────────────────────

CAMPAIGN_EMAIL_TEMPLATES = {
    "discount_campaign": {
        "subject": "🎁 Penawaran Spesial untuk Anda dari ChurnSense",
        "hero_color": "#7c3aed",
        "hero_emoji": "🎁",
        "hero_title": "Penawaran Eksklusif",
        "hero_subtitle": "Discount Campaign",
        "message": "Kami memiliki <strong>penawaran spesial</strong> untuk Anda! Sebagai pelanggan yang kami hargai, kami ingin memberikan diskon eksklusif dan voucher spesial untuk pengalaman yang lebih baik.",
        "action_text": "Nikmati penawaran diskon, voucher, atau promosi menarik yang telah kami siapkan khusus untuk Anda.",
    },
    "customer_support_followup": {
        "subject": "💬 Tim Support Kami Akan Menghubungi Anda",
        "hero_color": "#0ea5e9",
        "hero_emoji": "💬",
        "hero_title": "Customer Support Follow-up",
        "hero_subtitle": "Kami Peduli dengan Pengalaman Anda",
        "message": "Tim <strong>Customer Support</strong> kami akan segera menghubungi Anda untuk memastikan semua berjalan dengan baik dan menyelesaikan setiap pertanyaan atau masalah yang Anda miliki.",
        "action_text": "Harap bersiap untuk dihubungi oleh tim support kami dalam waktu dekat.",
    },
    "loyalty_program_enrollment": {
        "subject": "⭐ Selamat! Anda Terdaftar di Program Loyalitas",
        "hero_color": "#f59e0b",
        "hero_emoji": "⭐",
        "hero_title": "Program Loyalitas",
        "hero_subtitle": "Selamat Bergabung!",
        "message": "Selamat! Anda telah didaftarkan ke dalam <strong>Program Loyalitas</strong> kami. Nikmati berbagai keuntungan eksklusif, rewards, dan program retensi yang telah kami siapkan untuk pelanggan istimewa seperti Anda.",
        "action_text": "Mulai kumpulkan poin dan nikmati berbagai reward eksklusif program loyalitas kami.",
    },
    "product_recommendation": {
        "subject": "✨ Rekomendasi Produk Terbaik untuk Anda",
        "hero_color": "#10b981",
        "hero_emoji": "✨",
        "hero_title": "Product Recommendation",
        "hero_subtitle": "Pilihan Terbaik untuk Anda",
        "message": "Berdasarkan profil dan kebutuhan Anda, tim kami telah menyiapkan <strong>rekomendasi produk</strong> yang paling sesuai untuk meningkatkan pengalaman Anda bersama kami.",
        "action_text": "Temukan produk-produk pilihan yang kami rekomendasikan khusus berdasarkan kebutuhan Anda.",
    },
}


def build_campaign_html(customer_name: str, campaign_key: str, assigned_by_name: str) -> str:
    """Build HTML email body untuk notifikasi campaign ke customer."""
    t = CAMPAIGN_EMAIL_TEMPLATES.get(campaign_key, CAMPAIGN_EMAIL_TEMPLATES["discount_campaign"])

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 0; background: #f8fafc;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, {t['hero_color']} 0%, #1e1b4b 100%); padding: 40px 32px 32px; border-radius: 16px 16px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">{t['hero_emoji']}</div>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px;">{t['hero_title']}</h1>
        <p style="color: rgba(255,255,255,0.75); font-size: 13px; margin: 0;">{t['hero_subtitle']}</p>
      </div>

      <!-- Body -->
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 12px;">Halo, <strong>{customer_name}</strong>! 👋</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
          {t['message']}
        </p>

        <!-- Action Box -->
        <div style="background: #f0fdf4; border-left: 4px solid {t['hero_color']}; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0;">
            {t['action_text']}
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
          Program ini ditugaskan oleh tim kami: <strong>{assigned_by_name}</strong>.<br>
          Jika ada pertanyaan, jangan ragu untuk menghubungi kami.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 16px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">&copy; 2026 ChurnSense Inc. All rights reserved.</p>
      </div>
    </div>
    """


def send_campaign_email(
    to_email: str,
    customer_name: str,
    campaign_key: str,
    assigned_by_name: str,
) -> bool:
    """Kirim notifikasi campaign ke customer."""
    t = CAMPAIGN_EMAIL_TEMPLATES.get(campaign_key, CAMPAIGN_EMAIL_TEMPLATES["discount_campaign"])
    html = build_campaign_html(customer_name, campaign_key, assigned_by_name)
    return send_email(to_email, t["subject"], html)
