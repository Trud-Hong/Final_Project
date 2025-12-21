package com.farm.backend.service;

import org.springframework.stereotype.Service;
import org.apache.commons.math3.stat.regression.SimpleRegression;

@Service
public class PricePredictService {

    public double predictPrice(double[] dates, double[] prices, double futureDate) {

        SimpleRegression regression = new SimpleRegression(true);

        for (int i = 0; i < dates.length; i++) {
            regression.addData(dates[i], prices[i]);
        }

        return regression.predict(futureDate);
    }
}
