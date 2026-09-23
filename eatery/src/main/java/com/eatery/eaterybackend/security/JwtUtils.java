package com.eatery.eaterybackend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    // Tajni ključ za potpisivanje tokena (mora imati bar 256 bita)
    private final String jwtSecret = "mojTajniKljucKojiMoraBitiDovoljnoDugacakIJedinstven1234567890!";
    // Trajanje tokena: 24 sata (u milisekundama)
    private final int jwtExpirationMs = 86400000;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Generisanje tokena na osnovu korisničkog imena i uloge
    public String generateToken(String username, String uloga, Long id) {
        return Jwts.builder()
                .setSubject(username)
                .claim("uloga", uloga)
                .claim("id", id)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Izvlačenje korisničkog imena iz tokena
    public String getUsernameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Validacija JWT tokena
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("Neispravan JWT token: " + e.getMessage());
        }
        return false;
    }
}