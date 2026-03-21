-- Permite a administradores ver datos profundos para el dashboard de analytics

CREATE POLICY "admin_select_mantenimientos" ON public.mantenimientos FOR SELECT TO authenticated USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
CREATE POLICY "admin_select_averias" ON public.averias FOR SELECT TO authenticated USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
CREATE POLICY "admin_select_reportes_accidentes" ON public.reportes_accidentes FOR SELECT TO authenticated USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
CREATE POLICY "admin_select_chatbot_conversaciones" ON public.chatbot_conversaciones FOR SELECT TO authenticated USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
CREATE POLICY "admin_select_chatbot_analytics" ON public.chatbot_analytics FOR SELECT TO authenticated USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
