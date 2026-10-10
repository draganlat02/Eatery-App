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

    public record SifraObradjena(String email, String korisnickoIme, boolean odobreno) {}

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
                log.info("Email je podesen: obavjestenja se salju sa {}.", posiljalac);
            } catch (Exception e) {
                String razlog = e.getMessage() != null && !e.getMessage().isBlank()
                        ? e.getMessage() : e.getClass().getSimpleName();
                log.error("Prijava na {} nije uspjela ({}). Provjerite spring.mail.username i spring.mail.password u application.properties.",
                        impl.getHost(), razlog);
            }
        }
    }

    // Šalje se tek nakon što je izmjena sačuvana u bazi, u pozadini, da admin ne čeka SMTP server
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void posaljiEmailOAktivaciji(NalogAktiviran d) {
        String naziv = HtmlUtils.htmlEscape(nazivZaPoruku(d));
        posalji(d.email(), d.korisnickoIme(), "Vaš Eatery nalog je aktiviran",
                "Poštovani,\n\n"
                        + "administrator je odobrio vaš nalog za restoran \"" + nazivZaPoruku(d) + "\" na Eatery platformi.\n"
                        + "Sada se možete prijaviti i početi objavljivati jela i vrećice iznenađenja.\n\n"
                        + potpis(d.korisnickoIme()),
                okvir("Vaš nalog je aktiviran 🎉",
                        "<p>administrator je odobrio vaš nalog za restoran <strong>" + naziv + "</strong> na Eatery platformi. "
                                + "Sada se možete prijaviti i početi objavljivati jela i vrećice iznenađenja.</p>",
                        d.korisnickoIme()));
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void posaljiEmailOPromjeniSifre(SifraObradjena d) {
        if (d.odobreno()) {
            posalji(d.email(), d.korisnickoIme(), "Vaša Eatery šifra je promijenjena",
                    "Poštovani,\n\n"
                            + "administrator je odobrio vaš zahtjev za promjenu šifre. Od sada se prijavljujete novom šifrom.\n"
                            + "Ako niste vi tražili ovu promjenu, odmah se javite administratoru.\n\n"
                            + potpis(d.korisnickoIme()),
                    okvir("Šifra je promijenjena",
                            "<p>administrator je odobrio vaš zahtjev za promjenu šifre. Od sada se prijavljujete <strong>novom šifrom</strong>.</p>"
                                    + "<p>Ako niste vi tražili ovu promjenu, odmah se javite administratoru.</p>",
                            d.korisnickoIme()));
        } else {
            posalji(d.email(), d.korisnickoIme(), "Zahtjev za promjenu šifre je odbijen",
                    "Poštovani,\n\n"
                            + "administrator je odbio vaš zahtjev za promjenu šifre. Vaša dosadašnja šifra i dalje važi.\n\n"
                            + potpis(d.korisnickoIme()),
                    okvir("Zahtjev za promjenu šifre je odbijen",
                            "<p>administrator je odbio vaš zahtjev za promjenu šifre. Vaša <strong>dosadašnja šifra i dalje važi</strong>.</p>",
                            d.korisnickoIme()));
        }
    }

    private void posalji(String email, String korisnickoIme, String naslov, String tekst, String html) {
        if (email == null || email.isBlank()) {
            log.warn("Email \"{}\" nije poslan: korisnik {} nema email adresu.", naslov, korisnickoIme);
            return;
        }
        if (!jeKonfigurisan()) {
            log.warn("Email \"{}\" za {} nije poslan jer email nije podesen (application.properties).", naslov, email);
            return;
        }

        try {
            JavaMailSender sender = mailSender.getObject();
            MimeMessage poruka = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(poruka, true, "UTF-8");
            helper.setFrom(posiljalac, "Eatery");
            helper.setTo(email);
            helper.setSubject(naslov);
            helper.setText(tekst, html);
            sender.send(poruka);
            log.info("Email \"{}\" poslan na {}.", naslov, email);
        } catch (Exception e) {
            log.error("Slanje emaila \"{}\" na {} nije uspjelo: {}", naslov, email, e.getMessage());
        }
    }

    private String nazivZaPoruku(NalogAktiviran d) {
        return d.nazivObjekta() != null && !d.nazivObjekta().isBlank() ? d.nazivObjekta() : d.korisnickoIme();
    }

    private String potpis(String korisnickoIme) {
        return "Korisničko ime: " + korisnickoIme + "\n"
                + "Prijava: " + frontendUrl + "\n\n"
                + "Vaš Eatery tim";
    }

    private String okvir(String naslov, String sadrzaj, String korisnickoIme) {
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#17201f">
                  <div style="background:#0f766e;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
                    <h2 style="margin:0;font-size:20px">%s</h2>
                  </div>
                  <div style="border:1px solid #e5e9e8;border-top:none;padding:24px;border-radius:0 0 12px 12px">
                    <p>Poštovani,</p>
                    %s
                    <p style="margin:20px 0">
                      <a href="%s" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">Prijavi se</a>
                    </p>
                    <p style="color:#687573;font-size:13px">Korisničko ime: <strong>%s</strong></p>
                    <p style="color:#687573;font-size:13px">Vaš Eatery tim</p>
                  </div>
                </div>
                """.formatted(HtmlUtils.htmlEscape(naslov), sadrzaj,
                HtmlUtils.htmlEscape(frontendUrl), HtmlUtils.htmlEscape(korisnickoIme));
    }
}
