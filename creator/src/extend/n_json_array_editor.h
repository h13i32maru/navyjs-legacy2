#ifndef N_JSON_ARRAY_EDITOR_H
#define N_JSON_ARRAY_EDITOR_H

#include <QPushButton>

#include <util/n_json.h>

class NJsonArrayEditor : public QPushButton
{
    Q_OBJECT
public:
    explicit NJsonArrayEditor(NJson widgetDefine, QWidget *parent = 0);
    NJson getJsonArray() const;
    void setJsonArray(const NJson &jsonArray);
    NJson getWidgetDefineJson();

private:
    NJson mWidgetDefine;
    NJson mJsonArray;

public slots:
    void showEditor();

signals:
    void changedJsonArray();
};

#endif // N_JSON_ARRAY_EDITOR_H
