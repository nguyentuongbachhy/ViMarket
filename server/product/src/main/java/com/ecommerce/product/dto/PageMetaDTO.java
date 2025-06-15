package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageMetaDTO {
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static PageMetaDTO fromPagedResponse(PagedResponseDTO<?> pagedResponse) {
        return PageMetaDTO.builder()
                .page(pagedResponse.getPage())
                .size(pagedResponse.getSize())
                .totalElements(pagedResponse.getTotalElements())
                .totalPages(pagedResponse.getTotalPages())
                .last(pagedResponse.isLast())
                .build();
    }
}