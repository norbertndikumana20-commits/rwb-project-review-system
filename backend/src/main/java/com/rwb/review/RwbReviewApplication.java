package com.rwb.review;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RwbReviewApplication {

    public static void main(String[] args) {
        SpringApplication.run(RwbReviewApplication.class, args);
    }
}
