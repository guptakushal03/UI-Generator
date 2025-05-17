def generate_html_css(elements):
    html_parts = []
    css_parts = []
    type_counters = {}

    for el in elements:
        el_type = el.get("type", "div")
        el_name = el.get("customName", "").strip()

        if not el_name:
            count = type_counters.get(el_type, 1)
            el_name = f"{el_type}{count}"
            type_counters[el_type] = count + 1

        if el_type == "input":
            input_type = el.get("inputType", "text")
            name = el_name
            required = el.get("required", False)
            required_attr = " required" if required else ""
            html_parts.append(
                f'<input type="{input_type}" class="{el_name}" name="{name}" placeholder="{el_name}"{required_attr}>'
            )
        else:
            html_parts.append(f'<{el_type} class="{el_name}">{el_name}</{el_type}>')

        base_width = el.get('width', 100)
        base_height = el.get('height', 100)
        style = (
            f".{el_name} {{ "
            f"position: absolute; "
            f"left: {el.get('x', 0)}px; "
            f"top: {el.get('y', 0)}px; "
            f"width: {base_width}px; "
            f"height: {base_height}px; "
            f"min-width: 50px; "
            f"border: 1px solid #ccc; "
            f"box-sizing: border-box; "
        )

        if el_type == "input":
            style += (
                f"padding: 0.5rem; "
                f"font-size: 0.875rem; "
            )
        elif el_type == "button":
            style += (
                f"background-color: #f0f0f0; "
                f"cursor: pointer; "
                f"text-align: center; "
                f"line-height: {base_height}px; "
                f"transition: background-color 0.2s, transform 0.2s; "
            )
        style += f"}}"

        if el_type == "button":
            style += (
                f"\n.{el_name}:hover {{ "
                f"background-color: #e6f3ff; "
                f"transform: scale(1.05); "
                f"}}"
            )

        style += (
            f"\n@media (max-width: 768px) {{ "
            f".{el_name} {{ "
            f"width: {base_width * 0.8}px; "
            f"height: {base_height * 0.8}px; "
            f"left: {el.get('x', 0) * 0.8}px; "
            f"top: {el.get('y', 0) * 0.8}px; "
            f"font-size: 0.75rem; "
            f"}} }}"
            f"\n@media (max-width: 480px) {{ "
            f".{el_name} {{ "
            f"width: {min(base_width * 0.6, 90)}vw; "
            f"height: {base_height * 0.6}px; "
            f"left: {el.get('x', 0) * 0.6}px; "
            f"top: {el.get('y', 0) * 0.6}px; "
            f"font-size: 0.7rem; "
            f"padding: 0.3rem; "
            f"}} }}"
        )

        css_parts.append(style)

    return "\n".join(html_parts), "\n".join(css_parts)