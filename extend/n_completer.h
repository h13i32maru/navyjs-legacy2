#ifndef N_COMPLETER_H
#define N_COMPLETER_H

#include <QCompleter>
#include <QComboBox>
#include <QStringListModel>

class NCompleter : public QCompleter
{
    Q_OBJECT
public:
    explicit NCompleter(const QStringList &list, QObject *parent = 0);
    void setComboBox(QComboBox *combo);

private:
    QStringList mList;
    QStringListModel *mModel;

signals:

private slots:
    void update(const QString &word);
};

#endif // N_COMPLETER_H
