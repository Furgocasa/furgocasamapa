-- Permite a administradores con is_admin=true ver todas las filas de user_interactions
-- (el dashboard de analytics usa is_admin en user_metadata, no role='admin')

CREATE POLICY "admin_is_admin_select_all_user_interactions"
  ON public.user_interactions FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (SELECT (raw_user_meta_data->>'is_admin')::boolean
       FROM auth.users
       WHERE id = auth.uid()),
      false
    ) = true
  );
