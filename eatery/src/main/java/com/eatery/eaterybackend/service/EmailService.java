package com.eatery.eaterybackend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    public record NalogAktiviran(String email, String korisnickoIme, String nazivObjekta) {}

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String smtpKorisnik;
    private final String posiljalac;
    private final String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${spring.mail.username:}") String smtpKorisnik,
                        @Value("${eatery.mail.from:}") String posiljalac,
                        @Value("${eatery.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.smtpKorisnik = smtpKorisnik == null ? "" : smtpKorisnik.trim();
        this.posiljalac = posiljalac == null || posiljalac.isBlank() ? this.smtpKorisnik : posiljalac.trim();
        this.frontendUrl = frontendUrl;

        // Google prikazuje App password sa razmacima ("abcd efgh ijkl mnop")
        if (mailSender.getIfAvailable() instanceof JavaMailSenderImpl impl) {
            impl.setUsername(this.smtpKorisnik);
            if (impl.getPassword() != null) {
                impl.setPassword(impl.getPassword().replace(" ", ""));
            }
        }
    }

    public boolean jeKonfigurisan() {
        JavaMailSender sender = mailSender.getIfAvailable();
        boolean imaLozinku = !(sender instanceof JavaMailSenderImpl impl)
                || (impl.getPassword() != null && !impl.getPassword().isBlank());
        return !smtpKorisnik.isBlank() && sender != null && imaLozinku;
    }

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void provjeriPodesavanja() {
        if (!jeKonfigurisan()) {
            log.warn("Email nije podesen: upisite spring.mail.username i spring.mail.password u application.properties i restartujte backend.");
            return;
        }
        if (mailSender.getIfAvailable() instanceof JavaMailSenderImpl impl) {
            try {
                impl.testConnection();
                log.info("Email je podesen: obavjestenja o aktivaciji se salju sa {}.", posiljalac);
            } catch (Exception e) {
                String razlog = e.getMessage() != null && !e.getMessage().isBlank()
                        ? e.getMessage() : e.getClass().getSimpleName();
                log.error("Prijava na {} nije uspjela ({}). Provjerite spring.mail.username i spring.mail.password u application.properties.",
                        impl.getHost(), razlog);
            }
        }
    }

    // Šalje se tek nakon što je aktivacija sačuvana u bazi, u pozadini, da admin ne čeka SMTP server
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void posaljiEmailOAktivaciji(NalogAktiviran dogadjaj) {
        if (dogadjaj.email() == null || dogadjaj.email().isBlank()) {
            log.warn("Email o aktivaciji nije poslan: korisnik {} nema email adresu.", dogadjaj.korisnickoIme());
            return;
        }
        if (!jeKonfigurisan()) {
            log.warn("Email o aktivaciji za {} nije poslan jer email nije podesen (application.properties).",
                    dogadjaj.email());
            return;
        }

        try {
            JavaMailSender sender = mailSender.getObject();
            MimeMessage poruka = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(poruka, true, "UTF-8");
            helper.setFrom(posiljalac, "Eatery");
            helper.setTo(dogadjaj.email());
            helper.setSubject("Vaš Eatery nalog je aktiviran");
            helper.setText(tekst(dogadjaj), html(dogadjaj));
            sender.send(poruka);
            log.info("Email o aktivaciji naloga poslan na {}.", dogadjaj.email());
        } catch (Exception e) {
            log.error("Slanje emaila o aktivaciji na {} nije uspjelo: {}", dogadjaj.email(), e.getMessage());
        }
    }

    private String nazivZaPoruku(NalogAktiviran d) {
        return d.nazivObjekta() != null && !d.nazivObjekta().isBlank() ? d.nazivObjekta() : d.korisnickoIme();
    }

    private String tekst(NalogAktiviran d) {
        return "Poštovani,\n\n"
                + "administrator je odobrio vaš nalog za restoran \"" + nazivZaPoruku(d) + "\" na Eatery platformi.\n"
                + "Sada se možete prijaviti i početi objavljivati jela i vrećice iznenađenja.\n\n"
                + "Korisničko ime: " + d.korisnickoIme() + "\n"
                + "Prijava: " + frontendUrl + "\n\n"
                + "Vaš Eatery tim";
    }

    private String html(NalogAktiviran d) {
        String naziv = HtmlUtils.htmlEscape(nazivZaPoruku(d));
        String korisnik = HtmlUtils.htmlEscape(d.korisnickoIme());
        String link = HtmlUtils.htmlEscape(frontendUrl);
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#17201f">
                  <div style="background:#0f766e;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
                    <h2 style="margin:0;font-size:20px">Vaš nalog je aktiviran 🎉</h2>
                  </div>
                  <div style="border:1px solid #e5e9e8;border-top:none;padding:24px;border-radius:0 0 12px 12px">
                    <p>Poštovani,</p>
                    <p>administrator je odobrio vaš nalog za restoran <strong>%s</strong> na Eatery platformi.
                       Sada se možete prijaviti i početi objavljivati jela i vrećice iznenađenja.</p>
                    <p style="margin:20px 0">
                      <a href="%s" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">Prijavi se</a>
                    </p>
                    <p style="color:#687573;font-size:13px">Korisničko ime: <strong>%s</strong></p>
                    <p style="color:#687573;font-size:13px">Vaš Eatery tim</p>
                  </div>
                </div>
                """.formatted(naziv, link, korisnik);
    }
}
