package com.ecommerce.product.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.product.entity.Brand;

@Repository
public interface BrandRepository extends JpaRepository<Brand, String> {

    Optional<Brand> findByName(String name);

    Optional<Brand> findBySlug(String slug);
}