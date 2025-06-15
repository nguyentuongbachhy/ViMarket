package com.ecommerce.product.event.listener;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import com.ecommerce.product.event.model.InventoryStatusUpdateEvent;
import com.ecommerce.product.event.model.ProductRatingUpdateEvent;
import com.ecommerce.product.event.model.ProductSalesUpdateEvent;
import com.ecommerce.product.event.service.ProductEventService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductEventListener {

    private final ProductEventService productEventService;

    /**
     * Listen to sales updates from Order Service
     */
    @KafkaListener(topics = "order.product.sales.updated", 
                   groupId = "${spring.kafka.consumer.group-id}")
    public void handleProductSalesUpdate(
            @Payload Object payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment acknowledgment) {
        
        try {
            log.info("Received product sales update from topic: {}", topic);
            
            ProductSalesUpdateEvent event = extractMessage(payload, ProductSalesUpdateEvent.class);
            if (event != null) {
                productEventService.handleProductSalesUpdate(event);
                log.info("Successfully processed sales update for order: {}", event.getOrderId());
            }
            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Error processing product sales update from topic: {}", topic, e);
            acknowledgment.acknowledge();
        }
    }

    /**
     * Listen to inventory updates from Inventory Service
     */
    @KafkaListener(topics = "inventory.status.updated", 
                   groupId = "${spring.kafka.consumer.group-id}")
    public void handleInventoryStatusUpdate(
            @Payload Object payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment acknowledgment) {
        
        try {
            log.info("Received inventory status update from topic: {}", topic);
            
            InventoryStatusUpdateEvent event = extractMessage(payload, InventoryStatusUpdateEvent.class);
            if (event != null) {
                productEventService.handleInventoryStatusUpdate(event);
                log.info("Successfully processed inventory update for product: {}", event.getProductId());
            }
            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Error processing inventory status update from topic: {}", topic, e);
            acknowledgment.acknowledge();
        }
    }

    /**
     * Listen to rating updates from Review Service
     */
    @KafkaListener(topics = "review.product.rating.updated", 
                   groupId = "${spring.kafka.consumer.group-id}")
    public void handleProductRatingUpdate(
            @Payload Object payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment acknowledgment) {
        
        try {
            log.info("Received product rating update from topic: {}", topic);
            
            ProductRatingUpdateEvent event = extractMessage(payload, ProductRatingUpdateEvent.class);
            if (event != null) {
                productEventService.handleRatingUpdate(event);
                log.info("Successfully processed rating update for product: {}", event.getProductId());
            }
            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Error processing product rating update from topic: {}", topic, e);
            acknowledgment.acknowledge();
        }
    }

    // Keep the existing extractMessage helper method
    private <T> T extractMessage(Object payload, Class<T> targetClass) {
        try {
            ObjectMapper mapper = createObjectMapper();
            
            if (targetClass.isInstance(payload)) {
                return targetClass.cast(payload);
            }
            
            if (payload instanceof ConsumerRecord) {
                ConsumerRecord<?, ?> record = (ConsumerRecord<?, ?>) payload;
                Object value = record.value();
                
                if (value == null) {
                    return null;
                }
                
                if (targetClass.isInstance(value)) {
                    return targetClass.cast(value);
                }
                
                if (value instanceof String) {
                    String jsonString = (String) value;
                    return mapper.readValue(jsonString, targetClass);
                }
                
                String jsonString = mapper.writeValueAsString(value);
                return mapper.readValue(jsonString, targetClass);
            }
            
            if (payload instanceof String) {
                String jsonString = (String) payload;
                return mapper.readValue(jsonString, targetClass);
            }
            
            String jsonString = mapper.writeValueAsString(payload);
            return mapper.readValue(jsonString, targetClass);
            
        } catch (Exception e) {
            log.error("Failed to extract message of type {} from payload: {}", targetClass.getSimpleName(), payload, e);
            return null;
        }
    }

    private ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        return mapper;
    }
}