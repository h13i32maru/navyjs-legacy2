#include "plugin/view_plugin.h"

#include <QCheckBox>
#include <QComboBox>
#include <QDir>
#include <QLabel>
#include <QLineEdit>
#include <QSpinBox>
#include <QStandardItemModel>
#include <QTableView>
#include <n_project.h>
#include <QLayout>
#include <QHeaderView>
#include <QPushButton>
#include <QDebug>

#include <extend/n_combo_box.h>
#include <extend/n_json_array_editor.h>
#include <extend/n_text_list_selector.h>

#include <window/n_layout_json_table.h>

ViewPlugin* ViewPlugin::mInstance = NULL;

ViewPlugin* ViewPlugin::instance() {
    if (mInstance == NULL) {
        mInstance = new ViewPlugin();
    }

    return mInstance;
}

QWidget* ViewPlugin::createWidget(const NJson &widgetDefine, QObject *receiver, const char* slot) {
    NJson dummy;
    return ViewPlugin::createWidget(widgetDefine, dummy, receiver, slot);
}

QWidget* ViewPlugin::createWidget(const NJson &widgetDefine, NJson &viewJson, QObject *receiver, const char *slot) {
    QWidget *widget = NULL;
    const char *signal = NULL;

    QString type = widgetDefine.getStr("type");
    QString key = widgetDefine.getStr("key");

    if (type == "string") {
        QLineEdit *l = new QLineEdit();
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = l;
        signal = SIGNAL(textChanged(QString));
    }

    if (type == "number") {
        QSpinBox *s = new QSpinBox();
        s->setMinimum(0);
        s->setMaximum(9999);
        viewJson.set(key, widgetDefine.getInt("value"));
        widget = s;
        signal = SIGNAL(valueChanged(int));
    }

    if (type == "boolean") {
        QCheckBox *c = new QCheckBox();
        viewJson.set(key, widgetDefine.getBool("value"));
        widget = c;
        signal = SIGNAL(toggled(bool));
    }

    if (type == "stringList") {
        QComboBox *c = new QComboBox();
        NJson strings = widgetDefine.getObject("value");
        viewJson.set(key, strings.getStr("0"));
        for (int k = 0; k < strings.length(); k++) {
            c->addItem(strings.getStr(QString::number(k)));
        }
        widget = c;
        signal = SIGNAL(currentTextChanged(QString));
    }

    if (type == "numberList") {
        QComboBox *c = new QComboBox();
        NJson strings = widgetDefine.getObject("value");
        viewJson.set(key, strings.getInt("0"));
        for (int k = 0; k < strings.length(); k++) {
            c->addItem(strings.getStr(QString::number(k)));
        }
        widget = c;
        signal = SIGNAL(currentTextChanged(QString));
    }

    if (type == "pageList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::PAGE);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));
    }

    if (type == "sceneList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::SCENE);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));
    }

    if (type == "imageList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::IMAGE);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));
    }

    if (type == "layoutList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::LAYOUT);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));
    }

    if (type == "linkList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::LINK);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));
    }

    if (type == "array") {
        NJsonArrayEditor *e = new NJsonArrayEditor(widgetDefine);
        viewJson.set(key, widgetDefine.getObject("value"));
        widget = e;
        signal = SIGNAL(changedJsonArray());
    }

    // ----
    if (widget != NULL) {
        widget->setObjectName(type + ":" + key);
    }
    if (receiver != NULL && slot != NULL && widget != NULL && signal != NULL) {
        QObject::connect(widget, signal, receiver, slot);
    }
    return widget;
}

void ViewPlugin::syncWidgetToView(QWidget *widget, NJson &view, const QString &keyPrefix) {
    QString type = widget->objectName().split(":")[0];
    QString key = widget->objectName().split(":")[1];
    if (!keyPrefix.isEmpty()) {
        key = keyPrefix + "." + key;
    }

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        view.set(key, l->text());
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        view.set(key, s->value());
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        view.set(key, c->isChecked());
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        view.set(key, c->currentText());
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        view.set(key, c->currentText().toInt());
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "array") {
        NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
        view.set(key, e->getJsonArray());
    }
}

void ViewPlugin::syncViewToWidget(const NJson &view, QWidget *widget, const QString &keyPrefix) {
    QString type = widget->objectName().split(":")[0];
    QString key = widget->objectName().split(":")[1];

    if (!keyPrefix.isEmpty()) {
        key = keyPrefix + "." + key;
    }

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        l->setText(view.getStr(key));
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        s->setValue(view.getInt(key));
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        c->setChecked(view.getBool(key));
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        c->setCurrentText(view.getStr(key));
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        c->setCurrentText(QString::number(view.getInt(key)));
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "array") {
        NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
        e->setJsonArray(view.getObject(key));
    }
}

QString ViewPlugin::widgetToString(QWidget *widget) {
    QString type = widget->objectName().split(":")[0];

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        return l->text();
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        return QString::number(s->value());
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        return c->isChecked() ? "true": "false";
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        return c->currentText();
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        return c->currentText();
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "array") {
        NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
        return e->getJsonArray().stringify();
    }
}

QWidget* ViewPlugin::copyWidget(QWidget *widget) {
    QString type = widget->objectName().split(":")[0];

    QWidget *newWidget;
    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        QLineEdit *ll = new QLineEdit();
        ll->setText(l->text());
        newWidget = ll;
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        QSpinBox *ss = new QSpinBox();
        ss->setValue(s->value());
        newWidget = ss;
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        QCheckBox *cc = new QCheckBox();
        cc->setChecked(c->isChecked());
        newWidget = cc;
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        QComboBox *cc = new QComboBox();
        cc->setCurrentText(c->currentText());
        newWidget = cc;
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        QComboBox *cc = new QComboBox();
        cc->setCurrentText(c->currentText());
        newWidget = cc;
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        NTextListSelector *bb = new NTextListSelector();
        bb->setText(b->text());
        newWidget = bb;
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        NTextListSelector *bb = new NTextListSelector(b->getType());
        bb->setText(b->text());
        newWidget = bb;
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        NTextListSelector *bb = new NTextListSelector(b->getType());
        bb->setText(b->text());
        newWidget = bb;
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        NTextListSelector *bb = new NTextListSelector(b->getType());
        bb->setText(b->text());
        newWidget = bb;
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        NTextListSelector *bb = new NTextListSelector(b->getType());
        bb->setText(b->text());
        newWidget = bb;
    } else if (type == "array") {
        NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
        NJsonArrayEditor *ee = new NJsonArrayEditor(e->getWidgetDefineJson());
        ee->setJsonArray(e->getJsonArray());
        newWidget = ee;
    }

    newWidget->setObjectName(widget->objectName());
    return newWidget;
}

/*
QString ViewPlugin::encodeValue(const NJson &jsonArray, const QString &type, const QString &key) {
    if (type.contains("number")) {
        return QString::number(jsonArray.getInt(key));
    } else if (type.contains("boolean")) {
        return jsonArray.getBool(key) ? "true": "false";
    } else if (type.contains("array")) {
        return jsonArray.getObject(key).stringify();
    } else {
        return jsonArray.getStr(key);
    }
}
*/

/*
void ViewPlugin::decodeValue(QWidget *widget, const QString &value) {
    QString type = widget->objectName().split(":")[0];

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        l->setText(value);
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        s->setValue(value.toInt());
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        c->setChecked(value == "true");
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        c->setCurrentText(value);
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        c->setCurrentText(value);
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(value);
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(value);
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(value);
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(value);
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(value);
    }
}

void ViewPlugin::decodeValue(NJson &jsonArray, const QString &value, const QString &type, const QString &key) {
    if (type.contains("number")) {
        jsonArray.set(key, value.toInt());
    } else if (type.contains("boolean")) {
        jsonArray.set(key, value == "true");
    } else if (type == "array"){
        jsonArray.set(key, NJson(value));
    } else {
        jsonArray.set(key, value);
    }
}
*/

ViewPlugin::ViewPlugin() {
}

void ViewPlugin::load(const QString &pluginDirPath) {
    QDir pluginDir(pluginDirPath);
    pluginDir.setFilter(QDir::NoDotAndDotDot | QDir::Dirs);
    QStringList dirNames = pluginDir.entryList();

    for (int i = 0; i < dirNames.length(); i++) {
        QString manifestPath = pluginDirPath + "/" + dirNames[i] + "/manifest.json";
        NJson manifestJson;
        manifestJson.parseFromFilePath(manifestPath);
        if (manifestJson.getStr("type") != "view") {
            continue;
        }

        NJson scripts = manifestJson.getObject("scripts");
        for (int j = 0; j < scripts.length(); j++) {
            QString jsonName = scripts.getStr(QString::number(j));
            QString jsonPath = pluginDirPath + "/" + dirNames[i] + "/" + jsonName;
            NJson json;
            json.parseFromFilePath(jsonPath);
            mJsonList.append(json);
        }
    }
}

QList<NJson> ViewPlugin::getJsonList() const {
    return mJsonList;
}

void ViewPlugin::createTableView(QWidget *parentWidget, QMap<QString, QTableView*> *propMap, QMap<QString, NJson> *defaultMap, QObject *receiver, const char *slot) const{
    int height = QLabel("AAA").sizeHint().height() * 1.5;

    QList<NJson> jsonList = getJsonList();
    for (int i = 0; i < jsonList.length(); i++) {
        NJson json = jsonList[i];
        NJson widgetDefine = json.getObject("define");

        QModelIndex modelIndex;
        QStandardItemModel *model = new QStandardItemModel(widgetDefine.length(), 2);
        model->setHorizontalHeaderItem(0, new QStandardItem("Property"));
        model->setHorizontalHeaderItem(1, new QStandardItem("Value"));

        QTableView *tableView = new QTableView();
        parentWidget->layout()->addWidget(tableView);
        tableView->setModel(model);
        tableView->horizontalHeader()->setStretchLastSection(true);
        tableView->verticalHeader()->setHidden(true);
        //table viewのtab navigationを切ることで内部のwidgetがtab navigationできるようになる.
        tableView->setTabKeyNavigation(false);

        int row = 0;
        QString className = json.getStr("class");
        if (className == "Navy.View.View") {
            row = 2;

            // set id
            {
                QStandardItem *propLabel = new QStandardItem("id");
                propLabel->setEditable(false);
                propLabel->setSelectable(false);
                model->setItem(0, 0, propLabel);
                modelIndex = model->index(0, 1);
                QLineEdit *l = new QLineEdit();
                l->setObjectName("string:id");
                tableView->setIndexWidget(modelIndex, l);
                tableView->setRowHeight(0, height);
                QObject::connect(l, SIGNAL(textChanged(QString)), receiver, slot);
            }

            // set class
            {
                QStandardItem *propLabel = new QStandardItem("class");
                propLabel->setEditable(false);
                propLabel->setSelectable(false);
                model->setItem(1, 0, propLabel);
                modelIndex = model->index(1, 1);
                QLineEdit *l = new QLineEdit(className);
                l->setReadOnly(true);
                l->setObjectName("string:class");
                tableView->setIndexWidget(modelIndex, l);
                tableView->setRowHeight(1, height);
            }
        }

        NJson viewJson;

        for (int j = 0; j < widgetDefine.length(); j++, row++) {
            QString index = QString::number(j);
            QString label = widgetDefine.getStr(index + ".label");
            QString type = widgetDefine.getStr(index + ".type");
            QString key = widgetDefine.getStr(index + ".key");
            QWidget *widget = ViewPlugin::createWidget(widgetDefine.getObject(index), viewJson, receiver, slot);
            if (widget != NULL) {
                QStandardItem *propLabel = new QStandardItem(label);
                propLabel->setEditable(false);
                propLabel->setSelectable(false);
                model->setItem(row, 0, propLabel);
                modelIndex = model->index(row, 1);
                tableView->setIndexWidget(modelIndex, widget);
                tableView->setRowHeight(row, height);
            }
        }

        tableView->setMinimumHeight((row + 1 ) * height);
        tableView->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
        tableView->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
        tableView->hide();

        propMap->insert(className, tableView);
        defaultMap->insert(className, viewJson);
    }

    ((QHBoxLayout *)parentWidget->layout())->addStretch();
}

void ViewPlugin::syncViewToWidget(const NJson &view, QTableView *viewTable, QTableView *extraTable) const {
    this->syncViewToWidget(view, viewTable);
    this->syncViewToWidget(view, extraTable);
}

void ViewPlugin::syncViewToWidget(const NJson &view, QTableView *table) const {
    QAbstractItemModel *model = table->model();
    QModelIndex index;
    for (int row = 0; row < model->rowCount(); row++) {
        index = model->index(row, 1);
        QWidget *widget = table->indexWidget(index);
//        QString type = widget->objectName().split(":")[0];
//        QString key = widget->objectName().split(":")[1];

        widget->blockSignals(true);

        ViewPlugin::syncViewToWidget(view, widget);
        /*
        if (type == "string") {
            QLineEdit *l = (QLineEdit*) widget;
            l->setText(view.getStr(key));
        } else if (type == "number") {
            QSpinBox *s = (QSpinBox*) widget;
            s->setValue(view.getInt(key));
        } else if (type == "boolean") {
            QCheckBox *c = (QCheckBox*) widget;
            c->setChecked(view.getBool(key));
        } else if (type == "stringList") {
            QComboBox *c = (QComboBox*) widget;
            c->setCurrentText(view.getStr(key));
        } else if (type == "numberList") {
            QComboBox *c = (QComboBox*) widget;
            c->setCurrentText(QString::number(view.getInt(key)));
        } else if (type == "pageList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            b->setText(view.getStr(key));
        } else if (type == "sceneList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            b->setText(view.getStr(key));
        } else if (type == "imageList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            b->setText(view.getStr(key));
        } else if (type == "linkList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            b->setText(view.getStr(key));
        } else if (type == "layoutList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            b->setText(view.getStr(key));
        } else if (type == "array") {
            NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
            e->setJsonArray(view.getObject(key));
        }
        */

        widget->blockSignals(false);
    }
}

void ViewPlugin::syncWidgetToView(NJson &view, QTableView *table, QTableView *extraTable) const {
    this->syncWidgetToView(view, table);
    this->syncWidgetToView(view, extraTable);
}

void ViewPlugin::syncWidgetToView(NJson &view, QTableView *table) const {
    QAbstractItemModel *model = table->model();
    QModelIndex index;
    for (int row = 0; row < model->rowCount(); row++) {
        index = model->index(row, 1);
        QWidget *widget = table->indexWidget(index);
        ViewPlugin::syncWidgetToView(widget, view);
        /*
        QString type = widget->objectName().split(":")[0];
        QString key = widget->objectName().split(":")[1];

        if (type == "string") {
            QLineEdit *l = (QLineEdit*) widget;
            view.set(key, l->text());
        } else if (type == "number") {
            QSpinBox *s = (QSpinBox*) widget;
            view.set(key, s->value());
        } else if (type == "boolean") {
            QCheckBox *c = (QCheckBox*) widget;
            view.set(key, c->isChecked());
        } else if (type == "stringList") {
            QComboBox *c = (QComboBox*) widget;
            view.set(key, c->currentText());
        } else if (type == "numberList") {
            QComboBox *c = (QComboBox*) widget;
            view.set(key, c->currentText());
        } else if (type == "pageList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            view.set(key, b->text());
        } else if (type == "sceneList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            view.set(key, b->text());
        } else if (type == "imageList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            view.set(key, b->text());
        } else if (type == "linkList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            view.set(key, b->text());
        } else if (type == "layoutList") {
            NTextListSelector *b = (NTextListSelector*)widget;
            view.set(key, b->text());
        } else if (type == "array") {
            NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
            view.set(key, e->getJsonArray());
        }
        */
    }
}
