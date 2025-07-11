import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Inisialisasi Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Konfigurasi transporter email dengan timeout dan retry (fallback)
// CATATAN: Jika 2FA dinonaktifkan, gunakan password email biasa
// Jika 2FA diaktifkan, gunakan App Password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Gunakan STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Password email biasa jika 2FA dinonaktifkan
  },
  // Tambahkan timeout dan konfigurasi koneksi
  connectionTimeout: 60000, // 60 detik
  greetingTimeout: 30000,   // 30 detik
  socketTimeout: 60000,     // 60 detik
  tls: {
    rejectUnauthorized: false
  }
});

// Template email reset password
const createResetEmailTemplate = (resetLink: string, username: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #373A8D; color: white; padding: 20px; text-align: center;">
        <h1>Train4Best</h1>
        <h2>Reset Password</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Halo ${username},</p>
        
        <p>Kami menerima permintaan untuk mereset password akun Train4Best Anda.</p>
        
        <p>Jika Anda tidak meminta reset password ini, Anda dapat mengabaikan email ini.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #373A8D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Atau Anda dapat menyalin link berikut ke browser Anda:</p>
        <p style="word-break: break-all; color: #373A8D;">${resetLink}</p>
        
        <p><strong>Link ini akan kadaluarsa dalam 24 jam.</strong></p>
        
        <p>Terima kasih,<br>Tim Train4Best</p>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
      </div>
    </div>
  `;
};

// Template email certificate untuk instructor
const createCertificateEmailTemplate = (
  instructorName: string,
  certificateName: string,
  courseName: string,
  certificateNumber: string,
  issueDate: string,
  expiryDate: string,
  certificateLink: string,
  fileLink?: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
        <h1>Train4Best</h1>
        <h2>Certificate Issued</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Halo ${instructorName},</p>
        
        <p>Selamat! Certificate baru telah diterbitkan untuk Anda.</p>
        
        <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">Certificate Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Certificate Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${certificateName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Course:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${courseName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Certificate Number:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${certificateNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Issue Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${issueDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Valid Until:</strong></td>
              <td style="padding: 8px 0;">${expiryDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateLink}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
            View Certificate
          </a>
          ${fileLink ? `
          <a href="${fileLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
            Download Certificate
          </a>
          ` : ''}
        </div>
        
        <p>Certificate ini dapat diakses melalui dashboard instructor Anda.</p>
        
        <p>Terima kasih atas kontribusi Anda dalam program pelatihan Train4Best!</p>
        
        <p>Best regards,<br>Tim Train4Best</p>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
      </div>
    </div>
  `;
};

// Template email certificate untuk participant
const createParticipantCertificateEmailTemplate = (
  participantName: string,
  courseName: string,
  certificateNumber: string,
  issueDate: string,
  certificateLink: string,
  fileLink?: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
        <h1>Train4Best</h1>
        <h2>Certificate Issued</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Halo ${participantName},</p>
        
        <p>Selamat! Certificate baru telah diterbitkan untuk Anda.</p>
        
        <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">Certificate Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Course:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${courseName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Certificate Number:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${certificateNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Issue Date:</strong></td>
              <td style="padding: 8px 0;">${issueDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateLink}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
            View Certificate
          </a>
          ${fileLink ? `
          <a href="${fileLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
            Download Certificate
          </a>
          ` : ''}
        </div>
        
        <p>Certificate ini dapat diakses melalui dashboard participant Anda.</p>
        
        <p>Terima kasih telah mengikuti program pelatihan Train4Best!</p>
        
        <p>Best regards,<br>Tim Train4Best</p>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
      </div>
    </div>
  `;
};

// Fungsi untuk mengirim email reset password dengan retry
export const sendResetPasswordEmail = async (
  to: string,
  resetLink: string,
  username: string
) => {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Mencoba mengirim email ke ${to}`);
      
      // Coba Resend terlebih dahulu jika API key tersedia
      if (process.env.RESEND_API_KEY) {
        console.log('Menggunakan Resend untuk mengirim email...');
        
        const { data, error } = await resend.emails.send({
          from: 'Train4Best <onboarding@resend.dev>', // Gunakan domain default Resend
          to: [to],
          subject: 'Reset Password - Train4Best',
          html: createResetEmailTemplate(resetLink, username),
        });

        if (error) {
          console.error('Resend error:', error);
          throw error;
        }

        console.log('Email reset password berhasil dikirim via Resend:', data);
        return { success: true, messageId: data?.id };
      }
      
      // Fallback ke Nodemailer jika Resend tidak tersedia
      console.log('Menggunakan Nodemailer sebagai fallback...');
      console.log('Email config:', { 
        user: process.env.EMAIL_USER, 
        host: 'smtp.gmail.com', 
        port: 587 
      });
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Reset Password - Train4Best',
        html: createResetEmailTemplate(resetLink, username),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email reset password berhasil dikirim via Nodemailer:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} - Error mengirim email reset password:`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error: error };
      }
      
      // Tunggu sebentar sebelum mencoba lagi
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Fungsi untuk mengirim email certificate ke instructor
export const sendCertificateEmail = async (
  to: string,
  instructorName: string,
  certificateName: string,
  courseName: string,
  certificateNumber: string,
  issueDate: string,
  expiryDate: string,
  certificateLink: string,
  fileLink?: string
) => {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Mencoba mengirim email certificate ke ${to}`);
      
      // Coba Resend terlebih dahulu jika API key tersedia
      if (process.env.RESEND_API_KEY) {
        console.log('Menggunakan Resend untuk mengirim email certificate...');
        
        const { data, error } = await resend.emails.send({
          from: 'Train4Best <onboarding@resend.dev>',
          to: [to],
          subject: `Certificate Issued - ${certificateName}`,
          html: createCertificateEmailTemplate(
            instructorName,
            certificateName,
            courseName,
            certificateNumber,
            issueDate,
            expiryDate,
            certificateLink,
            fileLink
          ),
        });

        if (error) {
          console.error('Resend error:', error);
          throw error;
        }

        console.log('Email certificate berhasil dikirim via Resend:', data);
        return { success: true, messageId: data?.id };
      }
      
      // Fallback ke Nodemailer
      console.log('Menggunakan Nodemailer sebagai fallback...');
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: `Certificate Issued - ${certificateName}`,
        html: createCertificateEmailTemplate(
          instructorName,
          certificateName,
          courseName,
          certificateNumber,
          issueDate,
          expiryDate,
          certificateLink,
          fileLink
        ),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email certificate berhasil dikirim via Nodemailer:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} - Error mengirim email certificate:`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error: error };
      }
      
      // Tunggu sebentar sebelum mencoba lagi
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Fungsi untuk mengirim email konfirmasi password berhasil direset
export const sendPasswordResetConfirmationEmail = async (
  to: string,
  username: string
) => {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Mencoba mengirim email konfirmasi ke ${to}`);
      
      // Coba Resend terlebih dahulu jika API key tersedia
      if (process.env.RESEND_API_KEY) {
        console.log('Menggunakan Resend untuk mengirim email konfirmasi...');
        
        const { data, error } = await resend.emails.send({
          from: 'Train4Best <onboarding@resend.dev>', // Gunakan domain default Resend
          to: [to],
          subject: 'Password Berhasil Direset - Train4Best',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                <h1>Train4Best</h1>
                <h2>Password Berhasil Direset</h2>
              </div>
              
              <div style="padding: 20px; background-color: #f9f9f9;">
                <p>Halo ${username},</p>
                
                <p>Password akun Train4Best Anda telah berhasil direset.</p>
                
                <p>Jika Anda tidak melakukan reset password ini, segera hubungi tim support kami.</p>
                
                <p>Terima kasih,<br>Tim Train4Best</p>
              </div>
              
              <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              </div>
            </div>
          `,
        });

        if (error) {
          console.error('Resend error:', error);
          throw error;
        }

        console.log('Email konfirmasi berhasil dikirim via Resend:', data);
        return { success: true, messageId: data?.id };
      }
      
      // Fallback ke Nodemailer
      console.log('Menggunakan Nodemailer sebagai fallback...');
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Password Berhasil Direset - Train4Best',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
              <h1>Train4Best</h1>
              <h2>Password Berhasil Direset</h2>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p>Halo ${username},</p>
              
              <p>Password akun Train4Best Anda telah berhasil direset.</p>
              
              <p>Jika Anda tidak melakukan reset password ini, segera hubungi tim support kami.</p>
              
              <p>Terima kasih,<br>Tim Train4Best</p>
            </div>
            
            <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email konfirmasi reset password berhasil dikirim via Nodemailer:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} - Error mengirim email konfirmasi reset password:`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error: error };
      }
      
      // Tunggu sebentar sebelum mencoba lagi
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}; 

// Fungsi untuk mengirim email certificate ke participant
export const sendParticipantCertificateEmail = async (
  to: string,
  participantName: string,
  courseName: string,
  certificateNumber: string,
  issueDate: string,
  certificateLink: string,
  fileLink?: string
) => {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Mencoba mengirim email certificate participant ke ${to}`);
      
      // Coba Resend terlebih dahulu jika API key tersedia
      if (process.env.RESEND_API_KEY) {
        console.log('Menggunakan Resend untuk mengirim email certificate participant...');
        
        const { data, error } = await resend.emails.send({
          from: 'Train4Best <onboarding@resend.dev>',
          to: [to],
          subject: `Certificate Issued - ${courseName}`,
          html: createParticipantCertificateEmailTemplate(
            participantName,
            courseName,
            certificateNumber,
            issueDate,
            certificateLink,
            fileLink
          ),
        });

        if (error) {
          console.error('Resend error:', error);
          throw error;
        }

        console.log('Email certificate participant berhasil dikirim via Resend:', data);
        return { success: true, messageId: data?.id };
      }
      
      // Fallback ke Nodemailer
      console.log('Menggunakan Nodemailer sebagai fallback...');
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: `Certificate Issued - ${courseName}`,
        html: createParticipantCertificateEmailTemplate(
          participantName,
          courseName,
          certificateNumber,
          issueDate,
          certificateLink,
          fileLink
        ),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email certificate participant berhasil dikirim via Nodemailer:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} - Error mengirim email certificate participant:`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error: error };
      }
      
      // Tunggu sebentar sebelum mencoba lagi
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}; 