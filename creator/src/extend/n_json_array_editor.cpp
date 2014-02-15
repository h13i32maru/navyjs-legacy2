#include "n_json_array_editor.h"

#include <window/n_layout_json_table.h>

#include <QDebug>

NJsonArrayEditor::NJsonArrayEditor(NJson widgetDefine, QWidget *parent) : QPushButton(parent)
{
    mWidgetDefine = widgetDefine;
    mJsonArray.parse(QString("[]"));
    connect(this, SIGNAL(clicked()), this, SLOT(showEditor()));
}

NJson NJsonArrayEditor::getJsonArray() const{
    return mJsonArray;
}

void NJsonArrayEditor::setJsonArray(const NJson &jsonArray) {
    mJsonArray = jsonArray;
}

void NJsonArrayEditor::showEditor() {
    NLayoutJSONTable t(NULL);
    NJson columns = mWidgetDefine.getObject("columns");
    for (int i = 0; i < columns.length(); i++) {
        QString index = QString::number(i);
        t.addColumn(columns.getObject(index));
    }
    t.setJsonArray(mJsonArray);

    int result = t.exec();

    if (result == NLayoutJSONTable::Accepted) {
        mJsonArray = t.getJsonArray();
        emit changedJsonArray();
    }
}
