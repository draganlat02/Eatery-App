package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminSuspenzijaDTO {
    private Integer dani;
    private Integer sekunde;
    private LocalDateTime suspendovanDo;
}
