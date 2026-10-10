package com.eatery.eaterybackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EateryApplication {

    public static void main(String[] args) {
        SpringApplication.run(EateryApplication.class, args);
    }

}
