package com.match.partner.openapi.views.repository;



import com.match.partner.openapi.views.model.dao.Views;
import com.match.partner.openapi.views.model.dao.ViewsId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ViewsRepository extends JpaRepository<Views, ViewsId> {
    List<Views> findByIdProfileIdOrderByViewedAtDesc(Integer profileId); // To fetch profiles that viewed a specific user
}
