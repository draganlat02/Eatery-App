package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDTO {
    private String korisnickoIme;
    private String sifra;
}