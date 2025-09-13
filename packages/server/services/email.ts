import nodemailer from "nodemailer";

// To be implemented later

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: "user@example.com",
    accessToken: "ya29.Xx_XX0xxxxx-xX0X0XxXXxXxXXXxX0x",
  },
});

(async () => {
  const info = await transporter.sendMail({
    from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello ✔",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
  });

  console.log("Message sent:", info.messageId);
})();
