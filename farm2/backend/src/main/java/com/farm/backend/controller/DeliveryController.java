package com.farm.backend.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/delivery")
@CrossOrigin(origins = "http://localhost:3000")
public class DeliveryController {

    private final String CLIENT_ID = "AA2FDvTfOuHaNSjccG3rECDM";
    private final String CLIENT_SECRET = "9yresY63U259ispDacJungYC5ZZHvOTADiIkGfPz7y";

    private final String TRACKING_URL = "https://apis.tracker.delivery/graphql";

    @PostMapping
    public ResponseEntity<String> track(@RequestBody Map<String, String> body) {

        String carrier = body.get("carrier");
        String trackingNumber = body.get("trackingNumber");

        if (carrier == null || trackingNumber == null) {
            return ResponseEntity.badRequest().body("carrier 또는 trackingNumber가 없습니다.");
        }

        // GraphQL 요청 본문
        String graphqlQuery = "{ \"query\": \"query Track($carrier: ID!, $trackingNumber: String!) { " +
                "track(carrierId: $carrier, trackingNumber: $trackingNumber) { " +
                "lastEvent { status time description } " +
                "events { status time description } " +
                "carrier { id name } " +
                "trackingNumber " +
                "} }\", " +
                "\"variables\": { " +
                "\"carrier\": \"" + carrier + "\", " +
                "\"trackingNumber\": \"" + trackingNumber + "\" " +
                "} }";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // ★ 정답: 두 개만 있어야 한다
        headers.set("X-CLIENT-ID", CLIENT_ID);
        headers.set("X-CLIENT-SECRET", CLIENT_SECRET);

        HttpEntity<String> request = new HttpEntity<>(graphqlQuery, headers);
        RestTemplate rest = new RestTemplate();

        ResponseEntity<String> response = rest.exchange(TRACKING_URL, HttpMethod.POST, request, String.class);

        return ResponseEntity.ok(response.getBody());
    }
}
