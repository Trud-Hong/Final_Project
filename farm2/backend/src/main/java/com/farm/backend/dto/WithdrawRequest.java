package com.farm.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WithdrawRequest {
    private String sellerId;
    private int amount;
}
